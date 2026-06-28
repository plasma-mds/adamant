import { screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

export const setupOfflineMode = ($) => {
  let checkModeAjaxCall = null;
  $.ajax.mockImplementation((options) => {
    if (options.url === '/api/check_mode') {
      checkModeAjaxCall = options;
    }
    return { abort: vi.fn() };
  });
  if (checkModeAjaxCall) {
    act(() => {
      checkModeAjaxCall.error();
    });
  }
  return checkModeAjaxCall;
};

export const loadSchemaFromMenu = async (schemaFileName) => {
  const openBtn = screen.getByLabelText('Open');
  fireEvent.click(openBtn);
  const option = await screen.findByText(schemaFileName);
  fireEvent.click(option);
};

export const fillFormField = (labelPattern, value) => {
  const input = screen.getByLabelText(labelPattern);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

export const clickDownloadMenuOption = (downloadOption) => {
  const downloadMenuBtn = screen.getByRole('button', { name: /Download Schema\/Data/i });
  fireEvent.click(downloadMenuBtn);
  const downloadBtn = screen.getByText(downloadOption);
  fireEvent.click(downloadBtn);
  return downloadBtn;
};

export const clearDownloadMocks = (toast) => {
  toast.error.mockClear();
  window.URL.createObjectURL.mockClear();
};

export const getDownloadedData = async (readBlobAsText) => {
  const blob = window.URL.createObjectURL.mock.calls[0][0];
  const text = await readBlobAsText(blob);
  return JSON.parse(text);
};
