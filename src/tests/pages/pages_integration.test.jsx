import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import $ from 'jquery';
import { toast } from 'react-toastify';
import App from '../../App';
import AdamantMain from '../../pages/AdamantMain';
import SchemaTwo from '../../schemas/demo-schema.json';

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
      let checkModeAjaxCall = null;
      $.ajax.mockImplementation((options) => {
        if (options.url === '/api/check_mode') {
          checkModeAjaxCall = options;
        }
        return { abort: vi.fn() };
      });

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      // Trigger AJAX error callback for check_mode to transition into offline mode
      if (checkModeAjaxCall) {
        act(() => {
          checkModeAjaxCall.error();
        });
      }

      // Autocomplete element should be visible
      const selectSchemaInput = screen.getByLabelText(/Select existing schema/i);
      expect(selectSchemaInput).toBeInTheDocument();

      // Trigger selection of demo-schema.json
      const openBtn = screen.getByLabelText('Open');
      fireEvent.click(openBtn);
      const option = await screen.findByText('demo-schema.json');
      fireEvent.click(option);

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
      let checkModeAjaxCall = null;
      $.ajax.mockImplementation((options) => {
        if (options.url === '/api/check_mode') {
          checkModeAjaxCall = options;
        }
        return { abort: vi.fn() };
      });

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      if (checkModeAjaxCall) {
        act(() => {
          checkModeAjaxCall.error();
        });
      }

      // Load demo-schema.json
      const openBtn = screen.getByLabelText('Open');
      fireEvent.click(openBtn);
      const option = await screen.findByText('demo-schema.json');
      fireEvent.click(option);

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

    it('blocks download of JSON data when required fields are empty, but succeeds once filled', async () => {
      let checkModeAjaxCall = null;
      $.ajax.mockImplementation((options) => {
        if (options.url === '/api/check_mode') {
          checkModeAjaxCall = options;
        }
        return { abort: vi.fn() };
      });

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      if (checkModeAjaxCall) {
        act(() => {
          checkModeAjaxCall.error();
        });
      }

      // Load demo-schema.json
      const openBtn = screen.getByLabelText('Open');
      fireEvent.click(openBtn);
      const option = await screen.findByText('demo-schema.json');
      fireEvent.click(option);

      // Verify page loaded
      expect(screen.getByText('Scanning Electron Microscopy (SEM)')).toBeInTheDocument();

      // Reset mock history for toast and URL
      toast.error.mockClear();
      window.URL.createObjectURL.mockClear();

      // 1. Try to download - should fail because required fields are empty
      const downloadMenuBtn = screen.getByRole('button', { name: /Download Schema\/Data/i });
      fireEvent.click(downloadMenuBtn);

      const downloadJsonDataBtn = screen.getByText('Download JSON Data');
      fireEvent.click(downloadJsonDataBtn);

      // Verify validation fails and toast.error is called
      expect(toast.error).toHaveBeenCalled();
      expect(window.URL.createObjectURL).not.toHaveBeenCalled();

      // Clear the error toast mock
      toast.error.mockClear();

      // 2. Fill the required DeviceModel field
      const deviceModelInput = screen.getByLabelText(/Model of SEM Device/i);
      fireEvent.change(deviceModelInput, { target: { value: 'Jeol JSM-IT800' } });
      fireEvent.blur(deviceModelInput);

      // 3. Fill the SEMParameters sub-field to satisfy required SEMParameters container
      const accVoltageInput = screen.getByLabelText(/Acceleration Voltage/i);
      fireEvent.change(accVoltageInput, { target: { value: '15' } });
      fireEvent.blur(accVoltageInput);

      // 4. Try to download again - should succeed
      fireEvent.click(downloadMenuBtn);
      fireEvent.click(downloadJsonDataBtn);

      // Verify no toast error, and URL creator is called
      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      // Check contents of the downloaded blob
      const blob = window.URL.createObjectURL.mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
      const text = await readBlobAsText(blob);
      const parsed = JSON.parse(text);
      expect(parsed.DeviceModel).toBe('Jeol JSM-IT800');
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(15);
    });

    it('unblocks download of JSON data when a required field is deleted', async () => {
      let checkModeAjaxCall = null;
      $.ajax.mockImplementation((options) => {
        if (options.url === '/api/check_mode') {
          checkModeAjaxCall = options;
        }
        return { abort: vi.fn() };
      });

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      if (checkModeAjaxCall) {
        act(() => {
          checkModeAjaxCall.error();
        });
      }

      // Load demo-schema.json
      const openBtn = screen.getByLabelText('Open');
      fireEvent.click(openBtn);
      const option = await screen.findByText('demo-schema.json');
      fireEvent.click(option);

      // Fill the SEMParameters sub-field, leaving DeviceModel empty
      const accVoltageInput = screen.getByLabelText(/Acceleration Voltage/i);
      fireEvent.change(accVoltageInput, { target: { value: '15' } });
      fireEvent.blur(accVoltageInput);

      // Reset mock history
      toast.error.mockClear();
      window.URL.createObjectURL.mockClear();

      // Try downloading - fails since DeviceModel is required but empty
      const downloadMenuBtn = screen.getByRole('button', { name: /Download Schema\/Data/i });
      fireEvent.click(downloadMenuBtn);
      const downloadJsonDataBtn = screen.getByText('Download JSON Data');
      fireEvent.click(downloadJsonDataBtn);
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
      fireEvent.click(downloadMenuBtn);
      fireEvent.click(downloadJsonDataBtn);

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      // Check contents of the downloaded blob - should not contain DeviceModel
      const blob = window.URL.createObjectURL.mock.calls[0][0];
      const text = await readBlobAsText(blob);
      const parsed = JSON.parse(text);
      expect(parsed.DeviceModel).toBeUndefined();
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(15);
    });

    it('downloads Description List when the form is valid', async () => {
      let checkModeAjaxCall = null;
      $.ajax.mockImplementation((options) => {
        if (options.url === '/api/check_mode') {
          checkModeAjaxCall = options;
        }
        return { abort: vi.fn() };
      });

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      if (checkModeAjaxCall) {
        act(() => {
          checkModeAjaxCall.error();
        });
      }

      // Load demo-schema.json
      const openBtn = screen.getByLabelText('Open');
      fireEvent.click(openBtn);
      const option = await screen.findByText('demo-schema.json');
      fireEvent.click(option);

      // Fill required fields
      const deviceModelInput = screen.getByLabelText(/Model of SEM Device/i);
      fireEvent.change(deviceModelInput, { target: { value: 'Jeol JSM-IT800' } });
      fireEvent.blur(deviceModelInput);

      const accVoltageInput = screen.getByLabelText(/Acceleration Voltage/i);
      fireEvent.change(accVoltageInput, { target: { value: '15' } });
      fireEvent.blur(accVoltageInput);

      toast.error.mockClear();
      window.URL.createObjectURL.mockClear();

      // Open download menu and click "Download Description List"
      const downloadMenuBtn = screen.getByRole('button', { name: /Download Schema\/Data/i });
      fireEvent.click(downloadMenuBtn);
      const downloadDescListBtn = screen.getByText('Download Description List');
      fireEvent.click(downloadDescListBtn);

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
      let checkModeAjaxCall = null;
      $.ajax.mockImplementation((options) => {
        if (options.url === '/api/check_mode') {
          checkModeAjaxCall = options;
        }
        return { abort: vi.fn() };
      });

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      if (checkModeAjaxCall) {
        act(() => {
          checkModeAjaxCall.error();
        });
      }

      // Load demo-schema-2019-09.json
      const openBtn = screen.getByLabelText('Open');
      fireEvent.click(openBtn);
      const option = await screen.findByText('demo-schema-2019-09.json');
      fireEvent.click(option);

      // Verify that schema loaded and title/description of demo-schema-2019-09.json are rendered
      expect(screen.getByText('Scanning Electron Microscopy 2019-09')).toBeInTheDocument();

      // Find input fields and interact
      const deviceModelInput = screen.getByLabelText(/Model of SEM Device/i);
      fireEvent.change(deviceModelInput, { target: { value: 'Jeol JSM-IT800-2019' } });
      fireEvent.blur(deviceModelInput);

      const accVoltageInput = screen.getByLabelText(/Acceleration Voltage/i);
      fireEvent.change(accVoltageInput, { target: { value: '20' } });
      fireEvent.blur(accVoltageInput);

      toast.error.mockClear();
      window.URL.createObjectURL.mockClear();

      // Open download menu and click "Download JSON Data"
      const downloadMenuBtn = screen.getByRole('button', { name: /Download Schema\/Data/i });
      fireEvent.click(downloadMenuBtn);
      const downloadJsonDataBtn = screen.getByText('Download JSON Data');
      fireEvent.click(downloadJsonDataBtn);

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      const blob = window.URL.createObjectURL.mock.calls[0][0];
      const text = await readBlobAsText(blob);
      const parsed = JSON.parse(text);
      expect(parsed.DeviceModel).toBe('Jeol JSM-IT800-2019');
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(20);
    });

    it('supports draft/2020-12 schema in AdamantMain page integration flow', async () => {
      let checkModeAjaxCall = null;
      $.ajax.mockImplementation((options) => {
        if (options.url === '/api/check_mode') {
          checkModeAjaxCall = options;
        }
        return { abort: vi.fn() };
      });

      render(
        <MemoryRouter>
          <AdamantMain />
        </MemoryRouter>
      );

      if (checkModeAjaxCall) {
        act(() => {
          checkModeAjaxCall.error();
        });
      }

      // Load demo-schema-2020-12.json
      const openBtn = screen.getByLabelText('Open');
      fireEvent.click(openBtn);
      const option = await screen.findByText('demo-schema-2020-12.json');
      fireEvent.click(option);

      // Verify that schema loaded and title/description of demo-schema-2020-12.json are rendered
      expect(screen.getByText('Scanning Electron Microscopy 2020-12')).toBeInTheDocument();

      // Find input fields and interact
      const deviceModelInput = screen.getByLabelText(/Model of SEM Device/i);
      fireEvent.change(deviceModelInput, { target: { value: 'Jeol JSM-IT800-2020' } });
      fireEvent.blur(deviceModelInput);

      const accVoltageInput = screen.getByLabelText(/Acceleration Voltage/i);
      fireEvent.change(accVoltageInput, { target: { value: '25' } });
      fireEvent.blur(accVoltageInput);

      toast.error.mockClear();
      window.URL.createObjectURL.mockClear();

      // Open download menu and click "Download JSON Data"
      const downloadMenuBtn = screen.getByRole('button', { name: /Download Schema\/Data/i });
      fireEvent.click(downloadMenuBtn);
      const downloadJsonDataBtn = screen.getByText('Download JSON Data');
      fireEvent.click(downloadJsonDataBtn);

      expect(toast.error).not.toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      const blob = window.URL.createObjectURL.mock.calls[0][0];
      const text = await readBlobAsText(blob);
      const parsed = JSON.parse(text);
      expect(parsed.DeviceModel).toBe('Jeol JSM-IT800-2020');
      expect(parsed.SEMParameters.AccelerationVoltage).toBe(25);
    });
  });
});
