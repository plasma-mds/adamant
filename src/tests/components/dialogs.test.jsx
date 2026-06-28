import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import $ from 'jquery';
import { FormContext } from '../../FormContext';
import AddElement from '../../components/AddElement';
import EditSchemaHeader from '../../components/EditSchemaHeader';
import LDAPLoginDialog from '../../components/LDAPLoginDialog';
import FormReviewBeforeSubmit from '../../components/FormReviewBeforeSubmit';
import JSONSchemaViewerDialog from '../../components/JSONSchemaViewerDialog';
import ProgressDialog from '../../components/ProgressDialog';
import ReadingFilesDialog from '../../components/ReadingFilesDialog';
import UploadingFilesDialog from '../../components/UploadingFilesDialog';
import RightBar from '../../components/RightBar';

const renderWithProvider = (ui, contextValue = {}) => {
  const defaultContext = {
    updateParent: vi.fn(),
    convertedSchema: {
      properties: [],
    },
    handleDataDelete: vi.fn(),
    handleConvertedDataInput: vi.fn(),
    setSchemaSpecification: vi.fn(),
    ...contextValue,
  };

  return {
    ...render(
      <FormContext.Provider value={defaultContext}>
        {ui}
      </FormContext.Provider>
    ),
    contextValue: defaultContext,
  };
};

describe('Dialogue and Modal Components', () => {

  describe('AddElement Component', () => {
    it('renders Add Element dialog and triggers submit', () => {
      const setOpenDialogMock = vi.fn();
      const convertedSchemaMock = {
        properties: [],
      };

      const { contextValue } = renderWithProvider(
        <AddElement
          defaultSchema={{}}
          openDialog={true}
          setOpenDialog={setOpenDialogMock}
          UISchema={{ title: 'Parent Object' }}
          schemaTitle="Main Schema"
        />,
        {
          convertedSchema: convertedSchemaMock,
        }
      );

      // Verify dialog renders
      expect(screen.getByText(/Add Element in "Parent Object"/i)).toBeInTheDocument();

      // Change input values
      const textboxes = screen.getAllByRole('textbox');
      const keyInput = textboxes[0];
      const titleInput = textboxes[1];

      fireEvent.change(keyInput, { target: { value: 'test_key' } });
      fireEvent.blur(keyInput);
      fireEvent.change(titleInput, { target: { value: 'Test Element' } });

      const addBtn = screen.getByRole('button', { name: /ADD/i });
      fireEvent.click(addBtn);

      expect(contextValue.updateParent).toHaveBeenCalled();
      expect(setOpenDialogMock).toHaveBeenCalledWith(false);
    });

    it('triggers alert on duplicate key validation', () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const setOpenDialogMock = vi.fn();
      const convertedSchemaMock = {
        properties: [
          { fieldKey: 'duplicate_key', type: 'string' }
        ],
      };

      renderWithProvider(
        <AddElement
          defaultSchema={{}}
          openDialog={true}
          setOpenDialog={setOpenDialogMock}
          UISchema={{ title: 'Parent Object' }}
          schemaTitle="Main Schema"
        />,
        {
          convertedSchema: convertedSchemaMock,
        }
      );

      const textboxes = screen.getAllByRole('textbox');
      const keyInput = textboxes[0];
      fireEvent.change(keyInput, { target: { value: 'duplicate_key' } });
      fireEvent.blur(keyInput);

      const addBtn = screen.getByRole('button', { name: /ADD/i });
      fireEvent.click(addBtn);

      expect(alertMock).toHaveBeenCalledWith('Field ID already exists!');
      alertMock.mockRestore();
    });
  });

  describe('EditSchemaHeader Component', () => {
    it('renders schema header edit inputs and saves changes', () => {
      const setOpenDialogMock = vi.fn();
      const convertedSchemaMock = {
        title: 'Original Title',
        description: 'Original Desc',
      };

      const { contextValue } = renderWithProvider(
        <EditSchemaHeader
          openDialog={true}
          setOpenDialog={setOpenDialogMock}
          title="Original Title"
          description="Original Desc"
          schemaVersion="http://json-schema.org/draft-07/schema#"
          schemaID="orig-id"
        />,
        {
          convertedSchema: convertedSchemaMock,
        }
      );

      expect(screen.getByText(/Edit schema "Original Title"/i)).toBeInTheDocument();

      const titleInput = screen.getByDisplayValue('Original Title');
      fireEvent.change(titleInput, { target: { value: 'New Schema Title' } });

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      expect(contextValue.updateParent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Schema Title',
        })
      );
      expect(setOpenDialogMock).toHaveBeenCalledWith(false);
    });

    it('correctly swaps ID key and properties when converting dialects from draft-07 to draft-04', () => {
      const setOpenDialogMock = vi.fn();
      const convertedSchemaMock = {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "orig-id",
        title: 'Original Title',
        description: 'Original Desc',
        properties: [
          { fieldKey: "testField", type: "string", id: "test-id" }
        ]
      };

      const { contextValue } = renderWithProvider(
        <EditSchemaHeader
          openDialog={true}
          setOpenDialog={setOpenDialogMock}
          title="Original Title"
          description="Original Desc"
          schemaVersion="http://json-schema.org/draft-07/schema#"
          schemaID="orig-id"
        />,
        {
          convertedSchema: convertedSchemaMock,
        }
      );

      const versionSelect = screen.getByRole('combobox');
      fireEvent.change(versionSelect, { target: { value: 'http://json-schema.org/draft-04/schema#' } });

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      expect(contextValue.updateParent).toHaveBeenCalledWith(
        expect.objectContaining({
          $schema: 'http://json-schema.org/draft-04/schema#',
          id: 'orig-id',
          properties: [
            expect.objectContaining({
              fieldKey: "testField",
              id: "test-id"
            })
          ]
        })
      );
      expect(contextValue.updateParent.mock.calls[0][0].$id).toBeUndefined();
    });

    it('correctly swaps ID key and properties when converting dialects from draft-04 to draft-07', () => {
      const setOpenDialogMock = vi.fn();
      const convertedSchemaMock = {
        $schema: "http://json-schema.org/draft-04/schema#",
        id: "orig-id",
        title: 'Original Title',
        description: 'Original Desc',
        properties: [
          { fieldKey: "testField", type: "string", id: "test-id" }
        ]
      };

      const { contextValue } = renderWithProvider(
        <EditSchemaHeader
          openDialog={true}
          setOpenDialog={setOpenDialogMock}
          title="Original Title"
          description="Original Desc"
          schemaVersion="http://json-schema.org/draft-04/schema#"
          schemaID="orig-id"
        />,
        {
          convertedSchema: convertedSchemaMock,
        }
      );

      const versionSelect = screen.getByRole('combobox');
      fireEvent.change(versionSelect, { target: { value: 'http://json-schema.org/draft-07/schema#' } });

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      expect(contextValue.updateParent).toHaveBeenCalledWith(
        expect.objectContaining({
          $schema: 'http://json-schema.org/draft-07/schema#',
          $id: 'orig-id',
          properties: [
            expect.objectContaining({
              fieldKey: "testField",
              $id: "test-id"
            })
          ]
        })
      );
      expect(contextValue.updateParent.mock.calls[0][0].id).toBeUndefined();
    });
  });

  describe('LDAPLoginDialog Component', () => {
    it('renders input inputs and executes onSubmit callback', () => {
      const handleLoginMock = vi.fn();
      const setOpenDialogMock = vi.fn();
      const setEmailMock = vi.fn();
      const setTokenMock = vi.fn();

      render(
        <LDAPLoginDialog
          openLDAPLoginDialog={true}
          setOpenLDAPLoginDialog={setOpenDialogMock}
          handleLogin={handleLoginMock}
          email="john@example.com"
          setEmail={setEmailMock}
          token="secret123"
          setToken={setTokenMock}
        />
      );

      expect(screen.getByText(/Log in using your eLabFTW Token/i)).toBeInTheDocument();

      const emailInput = screen.getByDisplayValue('john@example.com');
      const tokenInput = screen.getByDisplayValue('secret123');

      expect(emailInput.value).toBe('john@example.com');
      expect(tokenInput.value).toBe('secret123');

      fireEvent.change(emailInput, { target: { value: 'john_doe@example.com' } });
      expect(setEmailMock).toHaveBeenCalledWith('john_doe@example.com');

      fireEvent.change(tokenInput, { target: { value: 'new_secret' } });
      expect(setTokenMock).toHaveBeenCalledWith('new_secret');

      const loginBtn = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(loginBtn);

      expect(handleLoginMock).toHaveBeenCalled();
    });
  });

  describe('FormReviewBeforeSubmit Component', () => {
    it('renders formatted JSON details and triggers submission', () => {
      const elabFTWDialogMock = vi.fn();
      const datasetSubmissionMock = vi.fn();
      const submitJobRequestMock = vi.fn();
      const cancelMock = vi.fn();

      render(
        <FormReviewBeforeSubmit
          onlineMode={true}
          openFormReviewDialog={true}
          setOpenFormReviewDialog={cancelMock}
          descriptionList="<div>Test User: Age 30</div>"
          setOpenFunctions={{
            setOpenCreateElabFTWExperimentDialog: elabFTWDialogMock,
            setOpenDatasetSubmissionDialog: datasetSubmissionMock,
          }}
          submitFunctions={{
            submitJobRequest: submitJobRequestMock,
          }}
          submitText="Submit Job Request"
          endPoint="/api/submit-job-request"
          loadedFiles={[]}
        />
      );

      expect(screen.getByText(/Form review and submission/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User: Age 30/i)).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /Submit/i });
      fireEvent.click(submitBtn);

      const createElabMenuItem = screen.getByText(/Create eLabFTW Experiment/i);
      fireEvent.click(createElabMenuItem);

      expect(elabFTWDialogMock).toHaveBeenCalledWith(true);
      expect(cancelMock).toHaveBeenCalledWith(false);
    });
  });

  describe('JSONSchemaViewerDialog Component', () => {
    it('renders JSON schema strings and triggers close', () => {
      const closeMock = vi.fn();

      render(
        <JSONSchemaViewerDialog
          openSchemaViewer={true}
          setOpenSchemaViewer={closeMock}
          jsonschema={{ type: 'object' }}
        />
      );

      expect(screen.getByText(/JSON Schema viewer/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/"type": "object"/i)).toBeInTheDocument();

      const closeBtn = screen.getByTitle(/Click to close the dialog box/i);
      fireEvent.click(closeBtn);

      expect(closeMock).toHaveBeenCalledWith(false);
    });
  });

  describe('Progress and Reading Dialogs', () => {
    it('ProgressDialog displays progress states', () => {
      render(
        <ProgressDialog
          openProgressDialog={true}
          setOpenProgressDialog={vi.fn()}
          title="Loading..."
          messages="Please wait while resources process."
          progress={50}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while resources process.')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('ReadingFilesDialog shows details', () => {
      render(
        <ReadingFilesDialog
          openReadingFilesDialog={true}
          setOpenReadingFilesDialog={vi.fn()}
        />
      );

      expect(screen.getByText('The files are being read.')).toBeInTheDocument();
      expect(screen.getByText('They are now being read. Please wait and do not turn off your device.')).toBeInTheDocument();
    });

    it('UploadingFilesDialog shows progress status', () => {
      render(
        <UploadingFilesDialog
          openUploadingFilesDialog={true}
          setOpenUploadingFilesDialog={vi.fn()}
        />
      );

      expect(screen.getByText('Upload in progress...')).toBeInTheDocument();
      expect(screen.getByText('Uploading the files. Please wait.')).toBeInTheDocument();
    });
  });

  describe('RightBar Component', () => {
    it('displays sign-in status and handles login triggers', () => {
      const setSessionMock = vi.fn();
      const setIsLoggedInMock = vi.fn();

      const { rerender } = render(
        <RightBar
          sessionData={{}}
          setSessionData={setSessionMock}
          isLoggedIn={false}
          setIsLoggedIn={setIsLoggedInMock}
        />
      );

      expect(screen.getByText(/Not signed in\./i)).toBeInTheDocument();
      const signInBtn = screen.getByRole('button', { name: /SIGN IN/i });
      expect(signInBtn).toBeInTheDocument();

      fireEvent.click(signInBtn);
      expect($.ajax).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/login',
        })
      );

      const sessionMock = {
        profile: {
          name: 'Guest User',
        },
      };

      rerender(
        <RightBar
          sessionData={sessionMock}
          setSessionData={setSessionMock}
          isLoggedIn={true}
          setIsLoggedIn={setIsLoggedInMock}
        />
      );

      expect(screen.getByText(/Hi, Guest User!/i)).toBeInTheDocument();
      const signOutBtn = screen.getByRole('button', { name: /SIGN OUT/i });
      expect(signOutBtn).toBeInTheDocument();

      fireEvent.click(signOutBtn);
      expect(setIsLoggedInMock).toHaveBeenCalledWith(false);
      expect($.ajax).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/logout',
        })
      );
    });
  });
});
