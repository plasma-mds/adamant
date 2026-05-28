import { describe, it, expect } from 'vitest';
import validateAgainstSchema from '../../components/utils/validateAgainstSchema';
import validateSchemaAgainstSpecification from '../../components/utils/validateSchemaAgainstSpecification';

describe('Utility Functions - Validation Helpers', () => {

    describe('validateAgainstSchema', () => {
        const schema = {
            type: 'object',
            $schema: 'http://json-schema.org/draft-07/schema#',
            properties: {
                name: {
                    type: 'string',
                    title: 'Full Name'
                },
                age: {
                    type: 'integer',
                    title: 'User Age',
                    minimum: 18
                }
            },
            required: ['name']
        };

        it('should validate valid form data successfully', () => {
            const formData = {
                name: 'Bob',
                age: 25
            };
            const [valid, messages] = validateAgainstSchema(formData, schema);
            expect(valid).toBe(true);
            expect(messages).toEqual([]);
        });

        it('should detect missing required fields and format messages', () => {
            const formData = {
                age: 25
            };
            const [valid, messages] = validateAgainstSchema(formData, schema);
            expect(valid).toBe(false);
            expect(messages).toHaveLength(1);
            expect(messages[0].message).toBe("'Full Name' field must be filled (required)");
            expect(messages[0].field_label).toBe('Full Name');
        });

        it('should detect type errors or numeric boundary violations', () => {
            const formData = {
                name: 'Bob',
                age: 15 // less than minimum 18
            };
            const [valid, messages] = validateAgainstSchema(formData, schema);
            expect(valid).toBe(false);
            expect(messages).toHaveLength(1);
            expect(messages[0].message).toContain("must be >= 18");
            expect(messages[0].field_label).toBe('User Age');
        });

        it('should support draft/2019-09 schema validations using Ajv2019', () => {
            const schema2019 = {
                $schema: 'https://json-schema.org/draft/2019-09/schema',
                type: 'object',
                properties: {
                    ipAddress: {
                        type: 'string',
                        title: 'IP Address'
                    }
                },
                required: ['ipAddress']
            };
            const validData = { ipAddress: '192.168.1.1' };
            const invalidData = {}; // missing required ipAddress

            const [valid1, messages1] = validateAgainstSchema(validData, schema2019);
            expect(valid1).toBe(true);

            const [valid2, messages2] = validateAgainstSchema(invalidData, schema2019);
            expect(valid2).toBe(false);
            expect(messages2).toHaveLength(1);
            expect(messages2[0].message).toBe("'IP Address' field must be filled (required)");
        });

        it('should support draft/2020-12 schema validations using Ajv2020', () => {
            const schema2020 = {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'object',
                properties: {
                    ipAddress: {
                        type: 'string',
                        title: 'IP Address'
                    }
                },
                required: ['ipAddress']
            };
            const validData = { ipAddress: '192.168.1.1' };
            const invalidData = {}; // missing required ipAddress

            const [valid1, messages1] = validateAgainstSchema(validData, schema2020);
            expect(valid1).toBe(true);

            const [valid2, messages2] = validateAgainstSchema(invalidData, schema2020);
            expect(valid2).toBe(false);
            expect(messages2).toHaveLength(1);
            expect(messages2[0].message).toBe("'IP Address' field must be filled (required)");
        });

        it('should correctly handle sibling properties next to $ref based on draft rules', () => {
            // Sibling property: minimum: 10 (which is greater than 5)
            const draft07Schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    volts: {
                        $ref: '#/definitions/voltage',
                        title: 'Volts',
                        type: 'number',
                        minimum: 10
                    }
                },
                definitions: {
                    voltage: {
                        type: 'number',
                        minimum: 0
                    }
                }
            };

            const draft2019Schema = {
                $schema: 'https://json-schema.org/draft/2019-09/schema',
                type: 'object',
                properties: {
                    volts: {
                        $ref: '#/$defs/voltage',
                        title: 'Volts',
                        type: 'number',
                        minimum: 10
                    }
                },
                $defs: {
                    voltage: {
                        type: 'number',
                        minimum: 0
                    }
                }
            };

            const draft2020Schema = {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'object',
                properties: {
                    volts: {
                        $ref: '#/$defs/voltage',
                        title: 'Volts',
                        type: 'number',
                        minimum: 10
                    }
                },
                $defs: {
                    voltage: {
                        type: 'number',
                        minimum: 0
                    }
                }
            };

            const testData = { volts: 5 };

            // Under Ajv v8, sibling properties are evaluated across all drafts, so volts: 5 is invalid under draft-07 too
            const [valid07, messages07] = validateAgainstSchema(testData, draft07Schema);
            expect(valid07).toBe(false);

            // In Draft 2019-09, sibling minimum: 10 is evaluated, so volts: 5 is invalid
            const [valid2019, messages2019] = validateAgainstSchema(testData, draft2019Schema);
            expect(valid2019).toBe(false);
            expect(messages2019).toHaveLength(1);
            expect(messages2019[0].message).toContain('must be >= 10');

            // In Draft 2020-12, sibling minimum: 10 is evaluated, so volts: 5 is invalid
            const [valid2020, messages2020] = validateAgainstSchema(testData, draft2020Schema);
            expect(valid2020).toBe(false);
            expect(messages2020).toHaveLength(1);
            expect(messages2020[0].message).toContain('must be >= 10');
        });

        it('should catch schema compilation errors and return user-friendly error details', () => {
            const incompatibleSchema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    itemsTuple: {
                        type: 'array',
                        prefixItems: [ { type: 'string' } ] // prefixItems is invalid keyword in Draft-07 strict mode compilation
                    }
                }
            };
            const testData = { itemsTuple: ['test'] };

            const [valid, messages] = validateAgainstSchema(testData, incompatibleSchema);
            expect(valid).toBe(false);
            expect(messages).toHaveLength(1);
            expect(messages[0].path).toBe('schema');
            expect(messages[0].message).toContain('Schema compilation failed');
        });
    });

    describe('validateSchemaAgainstSpecification', () => {
        it('should validate schemas that comply with standard drafts', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            };
            const spec = 'http://json-schema.org/draft-07/schema#';
            const [valid, message] = validateSchemaAgainstSpecification(schema, spec);
            expect(valid).toBe(true);
            expect(message).toBe('schema is valid');
        });

        it('should fail validation and return user-friendly errors on strict validation issues', () => {
            const invalidSchema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    age: {
                        type: 'integer',
                        unknownKeyword: 'this-should-fail' // strict mode compile error
                    }
                }
            };
            const spec = 'http://json-schema.org/draft-07/schema#';
            const [valid, message] = validateSchemaAgainstSpecification(invalidSchema, spec);
            expect(valid).toBe(false);
            expect(message).toContain('does not support keyword');
        });

        it('should validate schemas targeting draft/2019-09 specification', () => {
            const schema2019 = {
                $schema: 'https://json-schema.org/draft/2019-09/schema',
                type: 'object',
                properties: {
                    username: { type: 'string' }
                }
            };
            const spec = 'https://json-schema.org/draft/2019-09/schema';
            const [valid, message] = validateSchemaAgainstSpecification(schema2019, spec);
            expect(valid).toBe(true);
            expect(message).toBe('schema is valid');
        });

        it('should validate schemas targeting draft/2020-12 specification', () => {
            const schema2020 = {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'object',
                properties: {
                    username: { type: 'string' }
                }
            };
            const spec = 'https://json-schema.org/draft/2020-12/schema';
            const [valid, message] = validateSchemaAgainstSpecification(schema2020, spec);
            expect(valid).toBe(true);
            expect(message).toBe('schema is valid');
        });
    });

});
