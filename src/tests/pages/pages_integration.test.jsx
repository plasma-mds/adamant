import React from 'react';
import { render, fireEvent, screen, act, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import $ from 'jquery';
import { toast } from 'react-toastify';
import App from '../../App';
import AdamantMain from '../../pages/AdamantMain';
import SchemaTwo from '../../schemas/demo-schema.json';
import {
  setupOfflineMode,
  loadSchemaFromMenu,
  fillFormField,
  clickDownloadMenuOption,
  clearDownloadMocks,
  getDownloadedData,
} from './testHelpers';

// Mock standard router usage for ErrorBoundary test
vi.mock('../../pages/AsyncTestPage', () => {
  return {
    default: () => {
      throw new Error('Async test page crashed!');
    },
  };
});

// Helper to read blob text in environments (like JSDOM) where blob.text() is not implemented
const readBlobAsText = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
};

describe('Page Integration and Error Boundary Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // tests that need a connected NextCloud/eLabFTW state set it explicitly themselves;
    // without this, state set by one test (e.g. ncLoginState) leaks into later ones
    window.sessionStorage.clear();
  });

  describe('ErrorBoundary Component', () => {
    it('catches render exceptions and displays the error screen', () => {
      // Direct window location manipulation to trigger AsyncTestPage route
      window.history.pushState({}, 'Async Page', '/async-testpage');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      expect(screen.getAllByText(/Async test page crashed!/i).length).toBeGreaterThan(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('AdamantMain Integration', () => {
    it('renders normal offline workspace, loads schema, and interacts with fields', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // "Select existing schema" combobox should be visible
      const selectSchemaInput = screen.getByLabelText('Select existing schema');
      expect(selectSchemaInput).toBeInTheDocument();

      // Trigger selection of demo-schema.json
      await loadSchemaFromMenu('demo-schema.json');

      // Verify that schema loaded and title/description of demo-schema.json are rendered
      expect(screen.getByText('Scanning Electron Microscopy (SEM)')).toBeInTheDocument();

      // Find input fields
      const deviceModelInput = screen.getByLabelText(/Model of SEM Device/i);
      expect(deviceModelInput).toBeInTheDocument();

      // Interact with fields
      fireEvent.change(deviceModelInput, { target: { value: 'Jeol JSM-IT800' } });
      fireEvent.blur(deviceModelInput);

      expect(deviceModelInput.value).toBe('Jeol JSM-IT800');
    });

    it('toggles edit mode and deletes a field', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema.json
      await loadSchemaFromMenu('demo-schema.json');

      // Verify field "DeviceModel" is present
      expect(screen.getByLabelText(/Model of SEM Device/i)).toBeInTheDocument();

      // Enable Edit Mode by clicking Edit Mode button
      const editModeBtn = screen.getByText('Edit Mode: OFF');
      fireEvent.click(editModeBtn);

      // Now, edit/delete buttons should be visible. Look for tooltip or delete icon
      const deleteButton = screen.getByTitle(/Remove field "Model of SEM Device"/i);
      expect(deleteButton).toBeInTheDocument();

      // Click delete button
      fireEvent.click(deleteButton);

      // Verify field "DeviceModel" is deleted and no longer in the document
      expect(screen.queryByLabelText(/Model of SEM Device/i)).not.toBeInTheDocument();
    });

    it('toggles edit mode and deletes a nested field under an object container', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema.json
      await loadSchemaFromMenu('demo-schema.json');

      // Verify nested field "Working Distance [mm]" is present
      expect(screen.getByLabelText(/Working Distance/i)).toBeInTheDocument();

      // Enable Edit Mode
      const editModeBtn = screen.getByText('Edit Mode: OFF');
      fireEvent.click(editModeBtn);

      // Look for the delete button of the nested field
      const deleteButton = screen.getByTitle(/Remove field "Working Distance/i);
      expect(deleteButton).toBeInTheDocument();

      // Click delete button
      fireEvent.click(deleteButton);

      // Verify nested field is deleted
      expect(screen.queryByLabelText(/Working Distance/i)).not.toBeInTheDocument();
    });

    it('toggles edit mode and modifies a nested field under an object container', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema.json
      await loadSchemaFromMenu('demo-schema.json');

      // Verify nested field "Working Distance [mm]" is present
      expect(screen.getByLabelText(/Working Distance/i)).toBeInTheDocument();

      // Enable Edit Mode
      const editModeBtn = screen.getByText('Edit Mode: OFF');
      fireEvent.click(editModeBtn);

      // Find the edit button for the nested field (NumberType tooltip uses "Edit field ...")
      const editButton = screen.getByTitle(/Edit field "Working Distance/i);
      expect(editButton).toBeInTheDocument();

      // Click edit button to open dialog
      fireEvent.click(editButton);

      // In the EditElement dialog, scope queries to the dialog to avoid interference
      // with aria-hidden main content (MUI Dialog behavior)
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Modify the field title using getByRole to find the textbox in the dialog
      const allTextboxes = within(dialog).getAllByRole('textbox');
      // Field Title is the 3rd input (after Field Keyword and Field ID/URI)
      const titleInput = allTextboxes[2];
      fireEvent.change(titleInput, { target: { value: 'Working Distance New Label' } });

      // Click Save in the dialog
      const saveBtn = within(dialog).getByText('Save');
      fireEvent.click(saveBtn);

      // Verify the new title is rendered in the document
      expect(screen.getByLabelText(/Working Distance New Label/i)).toBeInTheDocument();
    });

    it('blocks download of JSON data when required fields are empty, but succeeds once filled', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema.json
      await loadSchemaFromMenu('demo-schema.json');

      // Verify page loaded
      expect(screen.getByText('Scanning Electron Microscopy (SEM)')).toBeInTheDocument();

      // Reset mock history for toast and URL
      clearDownloadMocks(toast);

      // 1. Try to download - should fail because required fields are empty
      clickDownloadMenuOption('Download JSON Data');

      // Verify validation fails and toast.error is called
      expect(toast.error).toHaveBeenCalled();
      expect(window.URL.createObjectURL).not.toHaveBeenCalled();

      // Clear the error toast mock
      toast.error.mockClear();

      // 2. Fill the required DeviceModel field
      fillFormField(/Model of SEM Device/i, 'Jeol JSM-IT800');

      // 3. Fill the SEMParameters sub-field to satisfy required SEMParameters container
      fillFormField(/Acceleration Voltage/i, '15');

      // 4. Try to download again - should succeed
      clearDownloadMocks(toast);
      clickDownloadMenuOption('Download JSON Data');

      // Verify no toast error, and URL creator is called
      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      // Check contents of the downloaded blob
      const parsed = await getDownloadedData(readBlobAsText);
      expect(parsed.DeviceModel).toBe('Jeol JSM-IT800');
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(15);
    });

    it('unblocks download of JSON data when a required field is deleted', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema.json
      await loadSchemaFromMenu('demo-schema.json');

      // Fill the SEMParameters sub-field, leaving DeviceModel empty
      fillFormField(/Acceleration Voltage/i, '15');

      // Reset mock history
      clearDownloadMocks(toast);

      // Try downloading - fails since DeviceModel is required but empty
      clickDownloadMenuOption('Download JSON Data');
      expect(toast.error).toHaveBeenCalled();
      toast.error.mockClear();

      // Enable Edit Mode to delete the field
      const editModeBtn = screen.getByText('Edit Mode: OFF');
      fireEvent.click(editModeBtn);

      // Click delete button for the empty required field (DeviceModel)
      const deleteButton = screen.getByTitle(/Remove field "Model of SEM Device"/i);
      fireEvent.click(deleteButton);

      // Verify input field is removed
      expect(screen.queryByLabelText(/Model of SEM Device/i)).not.toBeInTheDocument();

      // Try downloading again - should now succeed since the only required field left is SEMParameters, which is filled
      clearDownloadMocks(toast);
      clickDownloadMenuOption('Download JSON Data');

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      // Check contents of the downloaded blob - should not contain DeviceModel
      const parsed = await getDownloadedData(readBlobAsText);
      expect(parsed.DeviceModel).toBeUndefined();
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(15);
    });

    it('downloads Description List when the form is valid', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema.json
      await loadSchemaFromMenu('demo-schema.json');

      // Fill required fields
      fillFormField(/Model of SEM Device/i, 'Jeol JSM-IT800');
      fillFormField(/Acceleration Voltage/i, '15');

      clearDownloadMocks(toast);

      // Open download menu and click "Download Description List"
      clickDownloadMenuOption('Download Description List');

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      const blob = window.URL.createObjectURL.mock.calls[0][0];
      const text = await readBlobAsText(blob);
      // Description list is HTML format
      expect(text).toContain('<dl>');
      expect(text).toContain('Jeol JSM-IT800');
      expect(text).toContain('15');
    });

    it('supports draft/2019-09 schema in AdamantMain page integration flow', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema-2019-09.json
      await loadSchemaFromMenu('demo-schema-2019-09.json');

      // Verify that schema loaded and title/description of demo-schema-2019-09.json are rendered
      expect(screen.getByText('SEM Experiment — 2019-09')).toBeInTheDocument();

      // Find input fields and interact (DeviceModel is an enum select field)
      fillFormField(/Device Model/i, 'FEI Quanta 650');
      fillFormField(/Operator Name/i, 'Jane Doe');
      fillFormField(/Acceleration Voltage/i, '20');

      clearDownloadMocks(toast);

      // Open download menu and click "Download JSON Data"
      clickDownloadMenuOption('Download JSON Data');

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      const parsed = await getDownloadedData(readBlobAsText);
      expect(parsed.DeviceModel).toBe('FEI Quanta 650');
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(20);
    });

    it('supports draft/2020-12 schema in AdamantMain page integration flow', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // Load demo-schema-2020-12.json
      await loadSchemaFromMenu('demo-schema-2020-12.json');

      // Verify that schema loaded and title/description of demo-schema-2020-12.json are rendered
      expect(screen.getByText('SEM Experiment — 2020-12')).toBeInTheDocument();

      // Find input fields and interact (DeviceModel is an enum select field)
      fillFormField(/Device Model/i, 'Zeiss Sigma 300');
      fillFormField(/Operator Name/i, 'Jane Doe');
      fillFormField(/Acceleration Voltage/i, '25');

      clearDownloadMocks(toast);

      // Open download menu and click "Download JSON Data"
      clickDownloadMenuOption('Download JSON Data');

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      const parsed = await getDownloadedData(readBlobAsText);
      expect(parsed.DeviceModel).toBe('Zeiss Sigma 300');
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(25);
    });

    it('reveals NextCloud files only on hover, live-filtered by the typed search text', async () => {
      window.sessionStorage.setItem('ncLoginState', 'true');
      window.sessionStorage.setItem('ncDisplayName', 'Test User');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);
      fireEvent.change(input, { target: { value: 'demo' } });

      const ncListCall = $.ajax.mock.calls
        .map(([options]) => options)
        .find((options) => options.url === '/api/nextcloud/list');
      expect(ncListCall).toBeDefined();
      act(() => {
        ncListCall.success({
          status: 200,
          entries: [{ name: 'demo_sch_45.json', isFolder: false }],
        });
      });

      // collapsed by default, even though it matches the typed text
      expect(screen.queryByText('demo_sch_45.json')).not.toBeInTheDocument();

      const ncHeader = screen.getByText('NextCloud');
      fireEvent.mouseEnter(ncHeader);
      expect(await screen.findByText('demo_sch_45.json')).toBeInTheDocument();

      fireEvent.mouseLeave(ncHeader);
      // a short hover-intent grace period lets the mouse travel from the header into the
      // flyout without it collapsing, so closing isn't synchronous with mouseLeave
      await waitFor(() => {
        expect(screen.queryByText('demo_sch_45.json')).not.toBeInTheDocument();
      });
    });

    it('shows the bottom-right loading badge while hovering NextCloud fetches its schema list, and hides it once the list arrives', async () => {
      window.sessionStorage.setItem('ncLoginState', 'true');
      window.sessionStorage.setItem('ncDisplayName', 'Test User');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);
      fireEvent.change(input, { target: { value: 'demo' } });

      const ncListCall = $.ajax.mock.calls
        .map(([options]) => options)
        .find((options) => options.url === '/api/nextcloud/list');
      expect(ncListCall).toBeDefined();

      expect(await screen.findByTestId('global-loading-indicator')).toBeInTheDocument();

      act(() => {
        ncListCall.success({ status: 200, entries: [{ name: 'demo_sch_45.json', isFolder: false }] });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('global-loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('clears cached eLabFTW schema entries on logout, so a stale list is not offered afterward', async () => {
      window.sessionStorage.setItem('loginState', 'true');
      window.sessionStorage.setItem('firstName', 'Test');

      const { container } = render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);
      fireEvent.change(input, { target: { value: 'demo' } });

      const elabListCall = $.ajax.mock.calls
        .map(([options]) => options)
        .find((options) => options.url === '/api/elab/schemas_list');
      expect(elabListCall).toBeDefined();
      act(() => {
        elabListCall.success({
          status: 200,
          itemId: 936,
          entries: [{ id: 99, name: 'demo_01.json' }],
        });
      });

      fireEvent.mouseEnter(screen.getByText('eLabFTW'));
      expect(await screen.findByText('demo_01.json')).toBeInTheDocument();
      fireEvent.mouseLeave(screen.getByText('eLabFTW'));
      await waitFor(() => {
        expect(screen.queryByText('demo_01.json')).not.toBeInTheDocument();
      });

      // log out via the "eLabFTW: Test" chip's delete affordance
      const deleteIcon = container.querySelector('.MuiChip-deleteIcon');
      expect(deleteIcon).toBeTruthy();
      fireEvent.click(deleteIcon);

      // re-hover after logout - the previously cached entry must be gone, not just hidden
      fireEvent.change(input, { target: { value: 'demo' } });
      fireEvent.mouseEnter(screen.getByText('eLabFTW'));
      await waitFor(() => {
        expect(screen.queryByText('demo_01.json')).not.toBeInTheDocument();
      });
    });

    it('clicking "Browse NextCloud..." inside the flyout opens the NextCloud browse dialog', async () => {
      window.sessionStorage.setItem('ncLoginState', 'true');
      window.sessionStorage.setItem('ncDisplayName', 'Test User');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);

      const ncListCall = $.ajax.mock.calls
        .map(([options]) => options)
        .find((options) => options.url === '/api/nextcloud/list');
      act(() => {
        ncListCall.success({ status: 200, entries: [] });
      });

      fireEvent.mouseEnter(screen.getByText('NextCloud'));
      const browseOption = await screen.findByText('Browse NextCloud...');

      // Note: in a real browser, clicking this fires mousedown before click, and the
      // mousedown's default action would blur the input and collapse the flyout before
      // the click can land - the flyout's onMouseDown preventDefault (AdamantMain.jsx)
      // guards against that race. jsdom doesn't reproduce native focus-shift-on-mousedown,
      // so this test can only verify the click itself dispatches correctly, not the race.
      fireEvent.click(browseOption);

      expect(await screen.findByText('Browse Schema (NextCloud)')).toBeInTheDocument();
    });

    it('loads and renders a schema fetched from a custom URL, going through the standard schema pipeline', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);

      const loadFromUrlOption = await screen.findByText('Load schema from URL...');
      fireEvent.click(loadFromUrlOption);

      const urlInput = await screen.findByPlaceholderText('https://example.com/schema.json');
      fireEvent.change(urlInput, { target: { value: 'https://example.com/schema.json' } });

      const continueBtn = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueBtn);

      const loadCall = $.ajax.mock.calls
        .map(([options]) => options)
        .find((options) => options.url === '/api/load_schema_from_url');
      expect(loadCall).toBeDefined();
      expect(loadCall.data.url).toBe('https://example.com/schema.json');

      act(() => {
        loadCall.success({
          status: 200,
          schema: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'URL Test Schema',
            type: 'object',
            properties: {},
          },
        });
      });

      expect(await screen.findByText('URL Test Schema')).toBeInTheDocument();
      // the dialog closes itself once the schema is applied (waiting out its exit transition)
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com/schema.json')).not.toBeInTheDocument();
      });
    });

    it('shows an error toast when the URL does not return a valid JSON schema', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);

      fireEvent.click(await screen.findByText('Load schema from URL...'));
      fireEvent.change(await screen.findByPlaceholderText('https://example.com/schema.json'), {
        target: { value: 'https://example.com/not-json' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

      const loadCall = $.ajax.mock.calls
        .map(([options]) => options)
        .find((options) => options.url === '/api/load_schema_from_url');
      act(() => {
        loadCall.success({ status: 500, message: 'Unable to fetch or parse a JSON schema from that URL.' });
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Unable to fetch or parse a JSON schema from that URL.',
        expect.objectContaining({ toastId: 'loadSchemaFromUrlError' })
      );
      // dialog stays open so the user can fix the URL and retry
      expect(screen.getByPlaceholderText('https://example.com/schema.json')).toBeInTheDocument();
    });

    it('shows the bottom-right loading badge while a schema fetched from a URL is loading, and hides it once it is applied', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);
      fireEvent.click(await screen.findByText('Load schema from URL...'));
      fireEvent.change(await screen.findByPlaceholderText('https://example.com/schema.json'), {
        target: { value: 'https://example.com/urn-schema.json' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

      const loadCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/load_schema_from_url');
      expect(loadCall).toBeDefined();

      expect(await screen.findByTestId('global-loading-indicator')).toBeInTheDocument();

      act(() => {
        loadCall.success({
          status: 200,
          schema: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'URN Test Schema',
            type: 'object',
            properties: { URN: { type: 'string', title: 'URN' } },
          },
        });
      });

      expect(await screen.findByText('URN Test Schema')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByTestId('global-loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('connects to an external eLabFTW instance via the CONNECT menu, sending its own URL/email/token', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      fireEvent.click(screen.getByRole('button', { name: /^CONNECT$/i }));
      fireEvent.click(await screen.findByText('eLabFTW'));

      // the unified dialog defaults to the institution's own instance - switch to the
      // "different instance" option to reveal the URL field
      fireEvent.click(screen.getByText(/A different eLabFTW instance/i));

      fireEvent.change(screen.getByPlaceholderText('https://demo.elabftw.net'), {
        target: { value: 'https://demo.elabftw.net' },
      });
      // the dialog's Email/Token fields use MUI's default (non-outlined) TextField
      // variant, which doesn't auto-associate label/id, so query by input type instead
      // of getByLabelText
      fireEvent.change(document.querySelector('input[type="email"]'), { target: { value: 'jane@example.com' } });
      fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'secret456' } });
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

      const loginCalls = $.ajax.mock.calls.map(([options]) => options).filter((options) => options.url === '/api/login');
      const externalLoginCall = loginCalls[loginCalls.length - 1];
      expect(externalLoginCall.data).toEqual({
        email: 'jane@example.com',
        eLabToken: 'secret456',
        elabUrl: 'https://demo.elabftw.net',
      });

      act(() => {
        externalLoginCall.success({ status: 200, firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com' });
      });

      expect(await screen.findByText('eLabFTW: Jane')).toBeInTheDocument();
      // wait out the login dialog's exit transition before it fully leaves the DOM,
      // otherwise the rest of the page is still marked aria-hidden by the modal manager
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://demo.elabftw.net')).not.toBeInTheDocument();
      });

      // reconnecting is disabled once already connected - only one of internal/external
      // eLabFTW can be the active connection at a time
      fireEvent.click(screen.getByRole('button', { name: /^CONNECT$/i }));
      expect(screen.getByText('eLabFTW').closest('li')).toHaveAttribute('aria-disabled', 'true');
    });

    it('browses and reads a schema from the external eLabFTW instance, not the internal one', async () => {
      window.sessionStorage.setItem('externalLoginState', 'true');
      window.sessionStorage.setItem('externalElabUrl', 'https://demo.elabftw.net');
      window.sessionStorage.setItem('externalToken', 'secret456');
      window.sessionStorage.setItem('externalFirstName', 'Jane');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);

      // "eLabFTW" is a collapsible group (matching NextCloud), so its browse action lives
      // behind a hover flyout rather than being inline. Internal/external share this single
      // group and browse action - it routes to whichever one is actually connected.
      fireEvent.mouseEnter(screen.getByText('eLabFTW'));
      const browseExternalOption = await screen.findByText('Browse eLabFTW...');
      fireEvent.click(browseExternalOption);
      expect(await screen.findByText('Browse Schema (eLabFTW - External)')).toBeInTheDocument();

      const categoriesCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/elab/categories_list');
      expect(categoriesCall.data.eLabURL).toBe('https://demo.elabftw.net');
      expect(categoriesCall.data.eLabToken).toBe('secret456');
      act(() => {
        categoriesCall.success({ status: 200, categories: [] });
      });

      fireEvent.click(await screen.findByText('All items'));
      const itemsCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/elab/items_list');
      act(() => {
        itemsCall.success({ status: 200, items: [{ id: 936, title: 'Schemas-test' }] });
      });

      fireEvent.click(await screen.findByText('Schemas-test'));
      const uploadsCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/elab/item_uploads');
      expect(uploadsCall.data.itemId).toBe(936);
      act(() => {
        uploadsCall.success({ status: 200, entries: [{ id: 99, name: 'demo_01.json' }] });
      });

      fireEvent.click(await screen.findByText('demo_01.json'));
      const readCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/elab/schemas_read');
      expect(readCall.data).toEqual({
        eLabURL: 'https://demo.elabftw.net',
        eLabToken: 'secret456',
        itemId: 936,
        uploadId: 99,
      });
    });

    it('derives an editable URN-based filename before uploading the dataset to NextCloud', async () => {
      window.sessionStorage.setItem('ncLoginState', 'true');
      window.sessionStorage.setItem('ncDisplayName', 'Test User');
      window.sessionStorage.setItem('ncUrl', 'https://nextcloud.example.com');
      window.sessionStorage.setItem('ncUsername', 'testuser');
      window.sessionStorage.setItem('ncAppPassword', 'secret');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);

      // load a minimal schema with a "URN" field via the "Load schema from URL" feature
      const input = document.getElementById('select-available-schema');
      fireEvent.mouseDown(input);
      fireEvent.click(await screen.findByText('Load schema from URL...'));
      fireEvent.change(await screen.findByPlaceholderText('https://example.com/schema.json'), {
        target: { value: 'https://example.com/urn-schema.json' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

      const loadCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/load_schema_from_url');
      act(() => {
        loadCall.success({
          status: 200,
          schema: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'URN Test Schema',
            type: 'object',
            properties: {
              URN: { type: 'string', title: 'URN' },
            },
          },
        });
      });

      expect(await screen.findByText('URN Test Schema')).toBeInTheDocument();
      // wait out the "Load schema from URL" dialog's exit transition, otherwise the rest
      // of the page (including "Proceed") is still marked aria-hidden by the modal manager
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com/schema.json')).not.toBeInTheDocument();
      });

      fillFormField(/^URN$/i, 'urn:sample/2024:01');

      fireEvent.click(screen.getByRole('button', { name: /^Proceed$/i }));
      fireEvent.click(await screen.findByRole('button', { name: /^Submit$/i }));
      fireEvent.click(await screen.findByText('Submit Dataset to NextCloud'));

      // pick the (root) destination folder
      fireEvent.click(await screen.findByRole('button', { name: /Select this folder/i }));

      // the filename dialog should be pre-filled with the sanitized URN value, and the
      // schema file name should default to the same name with "-schema" appended
      const filenameInput = await screen.findByDisplayValue('urn-sample-2024-01.json');
      expect(screen.getByDisplayValue('urn-sample-2024-01-schema.json')).toBeInTheDocument();

      // editing the metadata file name (without touching the schema one) keeps them in sync
      fireEvent.change(filenameInput, { target: { value: 'custom-name.json' } });
      expect(screen.getByDisplayValue('custom-name-schema.json')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /^Upload$/i }));

      const uploadCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/nextcloud/upload');
      expect(uploadCall).toBeDefined();
      expect(uploadCall.data.get('metadataFilename')).toBe('custom-name.json');
      expect(uploadCall.data.get('schemaFilename')).toBe('custom-name-schema.json');
    });

    it('stops auto-syncing the schema file name once the user edits it directly', async () => {
      window.sessionStorage.setItem('ncLoginState', 'true');
      window.sessionStorage.setItem('ncDisplayName', 'Test User');
      window.sessionStorage.setItem('ncUrl', 'https://nextcloud.example.com');
      window.sessionStorage.setItem('ncUsername', 'testuser');
      window.sessionStorage.setItem('ncAppPassword', 'secret');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);
      await loadSchemaFromMenu('demo-schema.json');

      const listCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/nextcloud/list');
      act(() => {
        listCall.success({ status: 200, entries: [] });
      });

      fillFormField(/Model of SEM Device/i, 'Jeol JSM-IT800');
      fillFormField(/Acceleration Voltage/i, '15');

      fireEvent.click(screen.getByRole('button', { name: /^Proceed$/i }));
      fireEvent.click(await screen.findByRole('button', { name: /^Submit$/i }));
      fireEvent.click(await screen.findByText('Submit Dataset to NextCloud'));
      fireEvent.click(await screen.findByRole('button', { name: /Select this folder/i }));

      const filenameInput = await screen.findByDisplayValue('metadata.json');
      const schemaFilenameInput = screen.getByDisplayValue('metadata-schema.json');

      // manually override the schema file name
      fireEvent.change(schemaFilenameInput, { target: { value: 'my-own-schema-name.json' } });

      // further edits to the metadata name must no longer clobber that manual choice
      fireEvent.change(filenameInput, { target: { value: 'renamed-metadata.json' } });
      expect(screen.getByDisplayValue('my-own-schema-name.json')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /^Upload$/i }));

      const uploadCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/nextcloud/upload');
      expect(uploadCall.data.get('metadataFilename')).toBe('renamed-metadata.json');
      expect(uploadCall.data.get('schemaFilename')).toBe('my-own-schema-name.json');
    });

    it('shows the bottom-right loading badge while a dataset is being uploaded to NextCloud, and hides it once the upload finishes', async () => {
      window.sessionStorage.setItem('ncLoginState', 'true');
      window.sessionStorage.setItem('ncDisplayName', 'Test User');
      window.sessionStorage.setItem('ncUrl', 'https://nextcloud.example.com');
      window.sessionStorage.setItem('ncUsername', 'testuser');
      window.sessionStorage.setItem('ncAppPassword', 'secret');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);
      await loadSchemaFromMenu('demo-schema.json');

      // opening the combobox inside loadSchemaFromMenu also lazily triggers the schema
      // picker's own NextCloud quick-search list call (since ncLoginState is "true" here) -
      // resolve it now so its own loading flag doesn't mask the assertions below
      const listCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/nextcloud/list');
      act(() => {
        listCall.success({ status: 200, entries: [] });
      });

      // fill the required fields so "Proceed" doesn't reject the form as empty
      fillFormField(/Model of SEM Device/i, 'Jeol JSM-IT800');
      fillFormField(/Acceleration Voltage/i, '15');

      fireEvent.click(screen.getByRole('button', { name: /^Proceed$/i }));
      fireEvent.click(await screen.findByRole('button', { name: /^Submit$/i }));
      fireEvent.click(await screen.findByText('Submit Dataset to NextCloud'));
      fireEvent.click(await screen.findByRole('button', { name: /Select this folder/i }));
      fireEvent.click(screen.getByRole('button', { name: /^Upload$/i }));

      const uploadCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/nextcloud/upload');
      expect(uploadCall).toBeDefined();

      expect(await screen.findByTestId('global-loading-indicator')).toBeInTheDocument();

      act(() => {
        uploadCall.success({ status: 200 });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('global-loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('disables the NextCloud/eLabFTW options in the "upload input data" menu until connected', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);
      await loadSchemaFromMenu('demo-schema.json');

      fireEvent.click(screen.getByRole('button', { name: /upload a JSON data to prefill/i }));

      expect(screen.getByText('Local file').closest('li')).not.toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByText('NextCloud').closest('li')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByText('eLabFTW').closest('li')).toHaveAttribute('aria-disabled', 'true');
    });

    it('fills the form from a data file selected via NextCloud in the "upload input data" menu', async () => {
      window.sessionStorage.setItem('ncLoginState', 'true');
      window.sessionStorage.setItem('ncDisplayName', 'Test User');
      window.sessionStorage.setItem('ncUrl', 'https://nextcloud.example.com');
      window.sessionStorage.setItem('ncUsername', 'testuser');
      window.sessionStorage.setItem('ncAppPassword', 'secret');

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);
      await loadSchemaFromMenu('demo-schema.json');

      fireEvent.click(screen.getByRole('button', { name: /upload a JSON data to prefill/i }));
      const nextCloudOption = screen.getByText('NextCloud');
      expect(nextCloudOption.closest('li')).not.toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(nextCloudOption);

      expect(await screen.findByText('Browse Input Data (NextCloud)')).toBeInTheDocument();

      // opening the combobox earlier (inside loadSchemaFromMenu) also lazily triggered the
      // schema-picker's own NextCloud quick-search list call (since ncLoginState is "true"
      // for this test) - disambiguate by root path ("") to get the browse dialog's own call
      const listCall = $.ajax.mock.calls
        .map(([o]) => o)
        .find((o) => o.url === '/api/nextcloud/list' && o.data.path === '');
      expect(listCall).toBeDefined();
      act(() => {
        listCall.success({ status: 200, entries: [{ name: 'uploaded-data.json', isFolder: false }] });
      });

      fireEvent.click(await screen.findByText('uploaded-data.json'));

      const readCall = $.ajax.mock.calls.map(([o]) => o).find((o) => o.url === '/api/nextcloud/read');
      expect(readCall.data.path).toBe('uploaded-data.json');
      act(() => {
        readCall.success({ DeviceModel: 'Uploaded Model' });
      });

      const deviceModelInput = await screen.findByLabelText(/Model of SEM Device/i);
      expect(deviceModelInput.value).toBe('Uploaded Model');
    });

    it('clears the search box on reopen so all schemas are visible again, not just the previously selected one', async () => {
      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      setupOfflineMode($);
      await loadSchemaFromMenu('demo-schema.json');

      const input = document.getElementById('select-available-schema');
      expect(input.value).toBe('demo-schema.json');

      // reopening must not leave the previous selection sitting in the search box -
      // otherwise it filters the list down to just that one match
      fireEvent.mouseDown(input);
      expect(input.value).toBe('');

      fireEvent.mouseEnter(screen.getByText('Default'));
      expect(await screen.findByText('all-types.json')).toBeInTheDocument();
      expect(screen.getByText('demo-schema.json')).toBeInTheDocument();

      // closing without picking anything new restores the box to the current selection
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      await waitFor(() => {
        expect(input.value).toBe('demo-schema.json');
      });
    });
  });
});
