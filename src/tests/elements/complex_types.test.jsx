import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormContext } from '../../FormContext';
import ObjectType from '../../components/elements/ObjectType';
import ArrayType from '../../components/elements/ArrayType';
import FileUpload from '../../components/elements/FileUpload';
import ItemObjectType from '../../components/elements/array_items/ItemObjectType';

// Helper to render component wrapped in FormContext Provider
const renderWithProvider = (ui, contextValue = {}) => {
  const defaultContext = {
    updateParent: vi.fn(),
    convertedSchema: {},
    handleDataDelete: vi.fn(),
    handleConvertedDataInput: vi.fn(),
    handleLoadedFiles: vi.fn().mockReturnValue(false),
    handleRemoveFile: vi.fn(),
    loadedFiles: [],
    setLoadedFiles: vi.fn(),
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

describe('Complex Input Elements', () => {

  describe('ObjectType Component', () => {
    it('renders object container with expand and collapse toggle', () => {
      const fieldProperties = {
        fieldName: {
          fieldKey: 'fieldName',
          title: 'Nested Name',
          type: 'string',
        },
      };

      renderWithProvider(
        <ObjectType
          field_label="User Metadata"
          field_description="Enter user info"
          field_key="userMetadata"
          path="properties.userMetadata"
          pathFormData="userMetadata"
          field_properties={fieldProperties}
        />
      );

      // Verify header contents
      expect(screen.getByText(/User Metadata/i)).toBeInTheDocument();
      expect(screen.getByText('Enter user info')).toBeInTheDocument();

      // Collapse check: can toggle state
      const summaryBtn = screen.getByRole('button', { name: /User/i });
      expect(summaryBtn).toBeInTheDocument();
    });

    it('triggers delete object updates on delete icon click', () => {
      const convertedSchemaMock = {
        properties: {
          userMetadata: {
            properties: {},
          },
        },
      };

      const { contextValue } = renderWithProvider(
        <ObjectType
          field_label="User Metadata"
          field_key="userMetadata"
          path="properties.userMetadata"
          pathFormData="userMetadata"
          field_properties={{}}
          edit={true}
        />,
        {
          convertedSchema: convertedSchemaMock,
        }
      );

      const deleteBtn = screen.getByRole('button', { name: /Remove "User Metadata"/i });
      fireEvent.click(deleteBtn);

      expect(contextValue.updateParent).toHaveBeenCalled();
      expect(contextValue.handleDataDelete).toHaveBeenCalledWith('userMetadata');
    });

    it('does not crash when a schema field is "type: object" with no explicit properties (e.g. additionalProperties/patternProperties-only)', () => {
      // real-world schemas commonly use bare {"type": "object"} for free-form key-value
      // maps (see e.g. package.json's "resolutions"/"overrides") - object2array never sets
      // a "properties" key for these, so field_properties arrives as undefined
      renderWithProvider(
        <ObjectType
          field_label="Resolutions"
          field_key="resolutions"
          path="properties.resolutions"
          pathFormData="resolutions"
          field_properties={undefined}
        />
      );

      expect(screen.getByText(/Resolutions/i)).toBeInTheDocument();
    });
  });

  describe('ArrayType Component', () => {
    it('renders list header and triggers item insertion', () => {
      const fieldItems = {
        type: 'string',
      };

      const { contextValue } = renderWithProvider(
        <ArrayType
          field_label="Aliases list"
          field_key="aliases"
          path="properties.aliases"
          pathFormData="aliases"
          field_items={fieldItems}
          value={['alias1']}
          edit={true}
        />
      );

      expect(screen.getByText(/Aliases list/i)).toBeInTheDocument();
      expect(screen.getByText(/1 item/i)).toBeInTheDocument();

      const addBtn = screen.getByRole('button', { name: /Add Item/i });
      expect(addBtn).toBeInTheDocument();
      fireEvent.click(addBtn);

      // Add item triggers internal states setting properties
      expect(screen.getByText(/2 item/i)).toBeInTheDocument();
    });
  });

  describe('FileUpload Component', () => {
    it('renders drag-and-drop label and triggers clear handler', () => {
      const { contextValue } = renderWithProvider(
        <FileUpload
          field_label="Upload Document"
          field_key="document"
          path="properties.document"
          pathFormData="document"
          value="data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ="
          defaultValue="data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ="
        />
      );

      expect(screen.getByText('Upload Document:')).toBeInTheDocument();
      expect(screen.getByText('Upload a file')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: /Clear/i });
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);

      expect(contextValue.handleConvertedDataInput).toHaveBeenCalledWith(
        '',
        'properties.document.value',
        'boolean'
      );
    });
  });

  describe('ItemObjectType Component', () => {
    it('renders index summary header and assigns checkbox icon if file resource matches', () => {
      const fieldItems = {
        type: 'object',
        properties: {
          title: { type: 'string', value: 'Resource Doc' },
        },
      };

      const loadedFilesMock = [{ name: 'test-resource.txt' }];

      renderWithProvider(
        <ItemObjectType
          field_label="Resource Item"
          index={0}
          dataInputItems={[{ 'adamant-ui-specific-expand': true }]}
          setDataInputItems={vi.fn()}
          field_items={fieldItems}
          isResource={true}
        />,
        {
          loadedFiles: loadedFilesMock,
        }
      );

      expect(screen.getByText('Resource Item #1')).toBeInTheDocument();
      // Since isResource=true and loadedFiles[0] exists, it shows the assigned CheckBoxIcon
      const checkboxIcon = screen.queryByTestId('CheckBoxIcon');
      expect(checkboxIcon).toBeInTheDocument();
    });
  });
});
