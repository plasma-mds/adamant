import { describe, it, expect } from 'vitest';
import array2object from '../../components/utils/array2object';
import object2array from '../../components/utils/object2array';
import deleteKey from '../../components/utils/deleteKey';
import updateRequired from '../../components/utils/updateRequired';
import getUnit from '../../components/utils/getUnit';
import convertedSchemaPropertiesSort from '../../components/utils/convertedSchemaPropertiesSort';
import changeKeywords from '../../components/utils/changeKeywords';
import nicelySort from '../../components/utils/nicelySort';
import checkIDexistence from '../../components/utils/checkIDexistence';

describe('Utility Functions - Core Helper Logic', () => {

    describe('object2array and array2object mapping', () => {
        it('should correctly flatten schema properties into an array and reconstruct them', () => {
            const properties = {
                title: {
                    type: 'string',
                    enum: ['Mr', 'Ms']
                },
                age: {
                    type: 'integer',
                    default: 18
                }
            };

            const arrayResult = object2array(properties);
            expect(arrayResult).toHaveLength(2);
            
            // Check flattening mapping
            const titleField = arrayResult.find(item => item.fieldKey === 'title');
            expect(titleField).toBeDefined();
            expect(titleField.type).toBe('string');
            expect(titleField.enumerate).toEqual(['Mr', 'Ms']); // enum mapped to enumerate
            
            const ageField = arrayResult.find(item => item.fieldKey === 'age');
            expect(ageField).toBeDefined();
            expect(ageField.type).toBe('integer');
            expect(ageField.defaultValue).toBe(18); // default mapped to defaultValue

            // Reconstruct the object
            const reconstructed = array2object(arrayResult);
            expect(reconstructed).toHaveProperty('title');
            expect(reconstructed.title.type).toBe('string');
            expect(reconstructed.title.enum).toEqual(['Mr', 'Ms']); // enumerate mapped back to enum
            expect(reconstructed).toHaveProperty('age');
            expect(reconstructed.age.default).toBe(18); // defaultValue mapped back to default
            expect(reconstructed.title).not.toHaveProperty('fieldKey');
        });
    });

    describe('deleteKey', () => {
        it('should delete a property at a specific dot-separated path in an object', () => {
            const data = {
                user: {
                    details: {
                        name: 'Test',
                        age: 20
                    }
                }
            };
            const updated = deleteKey(data, 'user.details.age');
            expect(updated.user.details).toHaveProperty('name', 'Test');
            expect(updated.user.details).not.toHaveProperty('age');
        });

        it('should splice an item from a nested array path', () => {
            const data = {
                items: ['apple', 'banana', 'cherry']
            };
            const updated = deleteKey(data, 'items.1'); // delete index 1 ('banana')
            expect(updated.items).toEqual(['apple', 'cherry']);
        });
    });

    describe('updateRequired', () => {
        it('should add a field key to the required list when requiredChecked is true', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };

            const updated = updateRequired({
                selectedType: 'string',
                path: 'properties.name',
                requiredChecked: true,
                field_key: 'name',
                old_field_key: '',
                convertedSchema: schema
            });

            expect(updated.required).toEqual(['name']);
        });

        it('should remove a field key from the required list and clear the array if empty', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                },
                required: ['name']
            };

            const updated = updateRequired({
                selectedType: 'string',
                path: 'properties.name',
                requiredChecked: false,
                field_key: 'name',
                old_field_key: 'name',
                convertedSchema: schema
            });

            expect(updated).not.toHaveProperty('required');
        });
    });

    describe('getUnit', () => {
        it('should extract units inside square brackets', () => {
            expect(getUnit('Voltage [V]')).toEqual(['V']);
            expect(getUnit('Current [mA]')).toEqual(['mA']);
        });

        it('should return empty string if no brackets exist or if label is undefined', () => {
            expect(getUnit('Simple label')).toBe('');
            expect(getUnit(undefined)).toBe('');
        });
    });

    describe('convertedSchemaPropertiesSort', () => {
        it('should order properties list canonically', () => {
            const propertiesList = [
                {
                    type: 'string',
                    title: 'Title',
                    $id: 'id123',
                    description: 'Desc'
                }
            ];

            const sorted = convertedSchemaPropertiesSort(propertiesList);
            const keys = Object.keys(sorted[0]);
            
            // Check that $id is placed before title/description/type
            expect(keys.indexOf('$id')).toBeLessThan(keys.indexOf('title'));
            expect(keys.indexOf('title')).toBeLessThan(keys.indexOf('description'));
            expect(keys.indexOf('description')).toBeLessThan(keys.indexOf('type'));
        });
    });

    describe('changeKeywords', () => {
        it('should recursively change keywords in schema objects', () => {
            const schema = {
                type: 'object',
                enumerate: ['opt1', 'opt2'],
                properties: {
                    subitem: {
                        type: 'string',
                        enumerate: ['sub1']
                    }
                }
            };

            changeKeywords(schema, 'enumerate', 'enum');
            expect(schema).toHaveProperty('enum');
            expect(schema).not.toHaveProperty('enumerate');
            expect(schema.enum).toEqual(['opt1', 'opt2']);
            expect(schema.properties.subitem).toHaveProperty('enum');
            expect(schema.properties.subitem).not.toHaveProperty('enumerate');
        });
    });

    describe('nicelySort', () => {
        it('should group fields under their respective paths', () => {
            const arr = [
                { path: 'user', key: 'name', label: 'Name', value: 'Alice', pathURIs: [], pathLabels: [] },
                { path: 'user', key: 'age', label: 'Age', value: 30, pathURIs: [], pathLabels: [] },
                { path: 'address', key: 'city', label: 'City', value: 'New York', pathURIs: [], pathLabels: [] }
            ];

            const sorted = nicelySort(arr);
            expect(sorted).toHaveLength(2);
            expect(sorted[0].path).toBe('user');
            expect(sorted[0].fields).toHaveLength(2);
            expect(sorted[1].path).toBe('address');
            expect(sorted[1].fields).toHaveLength(1);
        });
    });

    describe('checkIDexistence', () => {
        it('should return true if fieldKey already exists in list', () => {
            const schema = {
                $id: 'name',
                properties: {
                    age: {
                        $id: 'age'
                    }
                }
            };

            expect(checkIDexistence(schema, 'name')).toBe(true);
            expect(checkIDexistence(schema, 'age')).toBe(true);
            expect(checkIDexistence(schema, 'gender')).toBe(false);
        });
    });

});
