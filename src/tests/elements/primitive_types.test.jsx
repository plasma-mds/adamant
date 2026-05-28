import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormContext } from '../../FormContext';
import BooleanType from '../../components/elements/BooleanType';
import IntegerType from '../../components/elements/IntegerType';
import NumberType from '../../components/elements/NumberType';
import StringType from '../../components/elements/StringType';
import StringUITypes from '../../components/elements/StringUITypes';
import ItemIntegerType from '../../components/elements/array_items/ItemIntegerType';
import ItemNumberType from '../../components/elements/array_items/ItemNumberType';
import ItemStringType from '../../components/elements/array_items/ItemStringType';

// Helper to render component wrapped in FormContext Provider
const renderWithProvider = (ui, contextValue = {}) => {
  const defaultContext = {
    updateParent: vi.fn(),
    convertedSchema: {},
    handleDataDelete: vi.fn(),
    handleConvertedDataInput: vi.fn(),
    SEMSelectedDevice: '',
    setSEMSelectedDevice: vi.fn(),
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

describe('Primitive Input Elements', () => {
  
  describe('BooleanType Component', () => {
    it('renders with label and checkbox value', () => {
      renderWithProvider(
        <BooleanType
          field_label="Enable Feature"
          field_key="enableFeature"
          path="enableFeature"
          pathFormData="enableFeature"
          value={true}
        />
      );

      const label = screen.getByText('Enable Feature:');
      expect(label).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('toggles value and propagates change via context on click', () => {
      const { contextValue } = renderWithProvider(
        <BooleanType
          field_label="Enable Feature"
          field_key="enableFeature"
          path="properties.enableFeature"
          pathFormData="enableFeature"
          value={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(contextValue.handleConvertedDataInput).toHaveBeenCalledWith(
        true,
        'properties.enableFeature.value',
        'boolean'
      );
    });

    it('renders error description when error occurs', () => {
      renderWithProvider(
        <BooleanType
          field_label="Enable Feature"
          field_key="enableFeature"
          path="properties.enableFeature"
          pathFormData="enableFeature"
          value="invalid-non-boolean" // triggers error hook
        />
      );

      const errorText = screen.getByText(/Invalid input type/i);
      expect(errorText).toBeInTheDocument();
    });
  });

  describe('IntegerType Component', () => {
    it('renders text input with unit and updates on blur', () => {
      const { contextValue } = renderWithProvider(
        <IntegerType
          field_label="Voltage [V]"
          field_key="voltage"
          path="properties.voltage"
          pathFormData="voltage"
          value={12}
        />
      );

      const input = screen.getByLabelText('Voltage [V]');
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('12');

      fireEvent.change(input, { target: { value: '240' } });
      fireEvent.blur(input);

      expect(contextValue.handleConvertedDataInput).toHaveBeenCalledWith(
        240,
        'properties.voltage.value',
        'integer'
      );
    });

    it('displays validation feedback when error is provided', () => {
      const { rerender, contextValue } = renderWithProvider(
        <IntegerType
          field_label="Voltage [V]"
          field_key="voltage"
          path="properties.voltage"
          pathFormData="voltage"
          value={12}
        />
      );

      rerender(
        <FormContext.Provider value={contextValue}>
          <IntegerType
            field_label="Voltage [V]"
            field_key="voltage"
            path="properties.voltage"
            pathFormData="voltage"
            value={12}
            adamant_field_error={true}
            adamant_error_description="Value must be greater than 0"
          />
        </FormContext.Provider>
      );

      const errorText = screen.getByText('Value must be greater than 0');
      expect(errorText).toBeInTheDocument();
    });
  });

  describe('NumberType Component', () => {
    it('renders and permits decimal inputs', () => {
      const { contextValue } = renderWithProvider(
        <NumberType
          field_label="Temperature [C]"
          field_key="temperature"
          path="properties.temperature"
          pathFormData="temperature"
          value={23.5}
        />
      );

      const input = screen.getByLabelText('Temperature [C]');
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('23.5');

      fireEvent.change(input, { target: { value: '-40.25' } });
      fireEvent.blur(input);

      expect(contextValue.handleConvertedDataInput).toHaveBeenCalledWith(
        -40.25,
        'properties.temperature.value',
        'number'
      );
    });
  });

  describe('StringType Component', () => {
    it('renders normal text field and supports value changes', () => {
      const { contextValue } = renderWithProvider(
        <StringType
          field_label="User Name"
          field_key="userName"
          path="properties.userName"
          pathFormData="userName"
          value="Test User"
        />
      );

      const input = screen.getByLabelText('User Name');
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('Test User');

      fireEvent.change(input, { target: { value: 'Updated User' } });
      fireEvent.blur(input);

      expect(contextValue.handleConvertedDataInput).toHaveBeenCalled();
    });

    it('renders options dropdown if enumerate list is provided', () => {
      renderWithProvider(
        <StringType
          field_label="Select Role"
          field_key="role"
          path="properties.role"
          pathFormData="role"
          field_enumerate={['Admin', 'User', 'Guest']}
          value="User"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });
  });

  describe('StringUITypes Component', () => {
    it('renders radio button selections', () => {
      render(
        <StringUITypes />
      );

      expect(screen.getByLabelText('Text')).toBeInTheDocument();
      expect(screen.getByLabelText('Long Text')).toBeInTheDocument();
      expect(screen.getByLabelText('List')).toBeInTheDocument();
    });
  });

  describe('Array Item Inputs', () => {
    it('ItemIntegerType calls delete handler and changes value', () => {
      const deleteMock = vi.fn();
      const setDataInputItemsMock = vi.fn();
      const { contextValue } = renderWithProvider(
        <ItemIntegerType
          field_label="Index"
          field_key="integer_item"
          index={2}
          dataInputItems={[10, 20, 30]}
          setDataInputItems={setDataInputItemsMock}
          path="properties.items.2"
          edit={true}
          handleDeleteArrayItem={deleteMock}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input.value).toBe('30');

      fireEvent.change(input, { target: { value: '45' } });
      fireEvent.blur(input);

      expect(contextValue.handleConvertedDataInput).toHaveBeenCalledWith(
        [10, 20, 45],
        'properties.items.2.value',
        'array'
      );

      const deleteBtn = screen.getByRole('button');
      fireEvent.click(deleteBtn);
      expect(deleteMock).toHaveBeenCalledWith(2);
    });

    it('ItemNumberType propagates float value updates', () => {
      const setDataInputItemsMock = vi.fn();
      const { contextValue } = renderWithProvider(
        <ItemNumberType
          field_label="Rating"
          field_key="rating_item"
          index={0}
          dataInputItems={[4.2, 5.0]}
          setDataInputItems={setDataInputItemsMock}
          path="properties.ratings.0"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input.value).toBe('4.2');

      fireEvent.change(input, { target: { value: '4.8' } });
      fireEvent.blur(input);

      expect(contextValue.handleConvertedDataInput).toHaveBeenCalledWith(
        [4.8, 5.0],
        'properties.ratings.0.value',
        'array'
      );
    });

    it('ItemStringType propagates string updates', () => {
      const setDataInputItemsMock = vi.fn();
      const { contextValue } = renderWithProvider(
        <ItemStringType
          field_key="text_item"
          index={1}
          dataInputItems={['Hello', 'World']}
          setDataInputItems={setDataInputItemsMock}
          path="properties.texts.1"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input.value).toBe('World');

      fireEvent.change(input, { target: { value: 'Vitest' } });
      fireEvent.blur(input);

      expect(contextValue.handleConvertedDataInput).toHaveBeenCalledWith(
        ['Hello', 'Vitest'],
        'properties.texts.1.value',
        'array'
      );
    });
  });
});
