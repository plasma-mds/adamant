"# Support for draft/2019-09 JSON Schema Dialect

We want to add support for the `draft/2019-09` JSON Schema dialect in the Adamant editor. Currently, the editor officially supports `draft-04` and `draft-07`. The user wants to use schemas that target `draft/2019-09`.

## Proposed Changes

We will register the `draft/2019-09` spec URLs in the dropdown menu and use Ajv's 2019-09 draft engine to validate schemas and data.

### Frontend Components

---

#### [MODIFY] [EditSchemaHeader.jsx](file:///c:/Users/Tripathi/Documents/Projects/Adamant/Implementation/adamant/src/components/EditSchemaHeader.jsx)
We will add `https://json-schema.org/draft/2019-09/schema` and `http://json-schema.org/draft/2019-09/schema` to the list of allowed schema drafts in the header dropdown.
* Update `allowedSchemaDrafts` array to include:
  * `\"https://json-schema.org/draft/2019-09/schema\"`
  * `\"http://json-schema.org/draft/2019-09/schema\"`

---

#### [MODIFY] [validateAgainstSchema.jsx](file:///c:/Users/Tripathi/Documents/Projects/Adamant/Implementation/adamant/src/components/utils/validateAgainstSchema.jsx)
We will update the form data validator to use `Ajv2019` when the schema uses a `2019-09` dialect.
* Import `Ajv2019` from `ajv/dist/2019`.
* Add a conditional block check: if the schema's `$schema` includes `\"2019-09\"`, compile it using `new Ajv2019({ allErrors: true })`.

---

#### [MODIFY] [validateSchemaAgainstSpecification.jsx](file:///c:/Users/Tripathi/Documents/Projects/Adamant/Implementation/adamant/src/components/utils/validateSchemaAgainstSpecification.jsx)
We will update the schema specification validator to support compiling `2019-09` schemas against their draft specification.
* Import `Ajv2019` from `ajv/dist/2019`.
* Add a conditional block check: if the schema's `$schema` includes `\"2019-09\"`, compile it using `new Ajv2019({ allErrors: true })`.

---

## Verification Plan

### Manual Verification
1. **Frontend Compilation**: Ensure the project compiles successfully with the ne
<truncated 726 bytes>