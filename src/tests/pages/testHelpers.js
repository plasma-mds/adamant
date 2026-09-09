import { screen, fireEvent, act, within, waitForElementToBeRemoved } from '@testing-library/react';
import { vi } from 'vitest';

export const setupOfflineMode = ($) => {
  const checkModeAjaxCall = $.ajax.mock.calls
    .map(([options]) => options)
    .find((options) => options.url === '/api/check_mode');
  if (checkModeAjaxCall) {
    act(() => {
      checkModeAjaxCall.error();
    });
  }
  return checkModeAjaxCall;
};

export const loadSchemaFromMenu = async (schemaFileName) => {
  // dismiss the "What would you like to do?" intro dialog, if still open, so it
  // doesn't leave the rest of the page marked aria-hidden for later role-based queries
  const introDialog = screen.queryByRole('dialog', { hidden: true });
  if (introDialog) {
    fireEvent.click(within(introDialog).getByAltText('header'));
    await waitForElementToBeRemoved(introDialog);
  }

  const input = document.getElementById('select-available-schema');
  fireEvent.mouseDown(input);
  fireEvent.change(input, { target: { value: schemaFileName } });

  // "Default" is collapsed behind a hover reveal, same as the remote service groups
  fireEvent.mouseEnter(screen.getByText('Default'));
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
