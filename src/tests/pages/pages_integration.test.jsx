import React from 'react';
import { render, fireEvent, screen, act, within } from '@testing-library/react';
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

      // Autocomplete element should be visible
      const selectSchemaInput = screen.getByLabelText(/Select existing schema/i);
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
      expect(screen.getByText('Scanning Electron Microscopy 2019-09')).toBeInTheDocument();

      // Find input fields and interact
      fillFormField(/Model of SEM Device/i, 'Jeol JSM-IT800-2019');
      fillFormField(/Acceleration Voltage/i, '20');

      clearDownloadMocks(toast);

      // Open download menu and click "Download JSON Data"
      clickDownloadMenuOption('Download JSON Data');

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      const parsed = await getDownloadedData(readBlobAsText);
      expect(parsed.DeviceModel).toBe('Jeol JSM-IT800-2019');
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
      expect(screen.getByText('Scanning Electron Microscopy 2020-12')).toBeInTheDocument();

      // Find input fields and interact
      fillFormField(/Model of SEM Device/i, 'Jeol JSM-IT800-2020');
      fillFormField(/Acceleration Voltage/i, '25');

      clearDownloadMocks(toast);

      // Open download menu and click "Download JSON Data"
      clickDownloadMenuOption('Download JSON Data');

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      const parsed = await getDownloadedData(readBlobAsText);
      expect(parsed.DeviceModel).toBe('Jeol JSM-IT800-2020');
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(25);
    });
  });
});
