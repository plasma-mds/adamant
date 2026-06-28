# Adamant Unit Testing Suite

This directory contains the frontend unit testing suite for the Adamant application. The tests are built using **Vitest**, **React Testing Library**, and **JSDOM** to validate utility functions, UI input elements, dialogue modals, and end-to-end page integration flows.

---

## Directory Structure

```text
src/tests/
├── README.md               # Test catalog and usage documentation
├── setup.js                # JSDOM environment and dependency mock configurations
├── utils/                  # Test scripts for core helper functions and schemas
│   ├── utils_logic.test.jsx
│   └── utils_validation.test.jsx
├── elements/               # Test scripts for primitive and complex input fields
│   ├── primitive_types.test.jsx
│   └── complex_types.test.jsx
├── components/             # Test scripts for dialog boxes and overlays
│   └── dialogs.test.jsx
└── pages/                  # Test scripts for end-to-end integration flows
    └── pages_integration.test.jsx
```

---

## Test Script Mapping and Coverage

### 1. Core Utilities (`src/tests/utils/`)

#### `utils_logic.test.jsx`
Validates schema transformations, sorting algorithms, path resolution, and state updates.
* **Tested Functions**:
  * `array2object`: Converts schema properties lists into JSON Schema trees (renaming `enumerate` -> `enum`, `defaultValue` -> `default`, and removing transient keys).
  * `array2objectAnyOf`: Converts polymorphic arrays into JSON Schema structures.
  * `changeKeywords`: Recursively replaces configuration keys inside schema lists.
  * `checkIDexistence` & `checkIfFieldIDExist`: Detects duplicate key names.
  * `convData2FormData`: Transforms internal UI datasets into standard form data structures.
  * `convertedSchemaPropertiesSort`: Canonical sorting of schema keywords (e.g. `$schema`, `$id`, `properties`, `required`). Includes tests to verify loop variable shadowing corrections.
  * `deleteKey` & `deleteKeySchema`: Deletes values at nested paths (splicing array indices or removing object keys).
  * `fillForm` & `fillValueWithEmptyString`: Prefills default values and cleans empty strings.
  * `generateUniqueID`: Checks formatting of random IDs.
  * `getPaths` & `getPathURIsAndLabels`: Traverses schema paths to construct breadcrumbs and URIs.
  * `getTableCandidates`: Filters arrays of objects suitable for grid rendering.
  * `getUnit`: Extracts bracketed measurement units (e.g., `[m/s]`, `[V]`) using regex.
  * `getValue` & `getValueInSchema` & `getValueInSchemaFullPath`: Dot-notation lookup.
  * `nicelySort`: Groups output properties under shared paths.
  * `object2array`: Flattens JSON Schema objects into flat UI-manageable arrays.
  * `updateRequired`: Syncs fields inside the `required` fields array (adding, removing, and deleting the array when empty).

#### `utils_validation.test.jsx`
Validates schema compliance wrappers.
* **Tested Functions**:
  * `validateAgainstSchema`: Standard Ajv and Ajv-draft-04 compilation checks, mapping validation errors to specific form fields using custom error rules.
  * `validateSchemaAgainstSpecification`: Resolves schema draft specs and handles unknown keyword complaints.

---

### 2. UI Elements (`src/tests/elements/`)

#### `primitive_types.test.jsx`
Tests single-field values, native input controls, and format limitations.
* **Tested Components**:
  * `BooleanType.jsx`: Renders checkbox toggles, updates state context, handles error resets on invalid entries, and manages field deletion.
  * `IntegerType.jsx` & `NumberType.jsx`: Coerces types (Integers/Floats), filters non-numeric characters, executes minimum/maximum/exclusive limit checks on blur, and displays unit sub-labels.
  * `StringType.jsx`: Handles free-text entry, native dropdown options, autocomplete suggestions, read-only indicators (for metadata hashes), and updates parent states on blur.
  * `StringUITypes.jsx`: Manages radio options lists and chips.
  * `ItemStringType.jsx`, `ItemIntegerType.jsx`, `ItemNumberType.jsx`: Array item cells for strings, integers, and numbers. Tests deletion and blur-value propagation.

#### `complex_types.test.jsx`
Tests containers, lists, file loaders, and polymorphic switchers.
* **Tested Components**:
  * `ObjectType.jsx`: Toggles visibility headers, invokes nested field creation dialogs, and manages drag-and-drop order updates.
  * `ArrayType.jsx` & `_ArrayType.jsx` & `ArrayItemRenderer.jsx`: Inserts default elements, removes items, reorders arrays via drag handles, and validates array size ranges against `minItems`/`maxItems`.
  * `AnyOfKeyword.jsx`: Switches sub-schemas when tabs are toggled.
  * `FileUpload.jsx` & `FileUpload2.jsx`: Validates files on drop (size, duplication, type checking), reads attachments as base64 URLs, and supports file resetting.
  * `ItemObjectType.jsx`: Renders nested object elements inside array loops inside expanding summary cards.

---

### 3. Dialogs & Overlays (`src/tests/components/`)

#### `dialogs.test.jsx`
Tests validation overlays and configuration screens.
* **Tested Components**:
  * `AddElement.jsx`: Validates unique element keys and updates the schema properties.
  * `EditElement.jsx`: Updates constraints (e.g. min, max, patterns, units) and manages custom dropdown options.
  * `EditSchemaHeader.jsx`: Updates schema title, description, and spec version.
  * `LDAPLoginDialog.jsx`: Validates user credential inputs and returns server authentication errors.
  * `CreateELabFTWExperimentDialog.jsx` & `DatasetSubmissionDialog.jsx`: Collects token credentials and tag settings for remote workspace registration.
  * `ChooseUseCasesDialog.jsx`: Manages checkboxes to select templates.
  * `EditExperiment.jsx`: Collects experiment details.
  * `FilesDialog.jsx`: Lists active files.
  * `FormReviewBeforeSubmit.jsx` & `JSONSchemaViewerDialog.jsx`: Previews raw schema structures and copy-to-clipboard actions.
  * `ProgressDialog.jsx`, `ReadingFilesDialog.jsx`, `UploadingFilesDialog.jsx`: Monitors background tasks.
  * `RenderExperimentCard.jsx`: Manages connection tags.
  * `RightBar.jsx`: Handles SIGN IN/OUT actions and AJAX session calls.

---

### 4. Integration Pages (`src/tests/pages/`)

#### `pages_integration.test.jsx`
Simulates full end-to-end user navigation flows.
* **Tested Pages**:
  * `AdamantMain.jsx`: Selects schemas, edits keys, prefills fields, performs validations, and executes file downloads.
  * `AdamantBrowseExp.jsx`, `AdamantRequest.jsx`, `AdamantProcess.jsx`: Integrates specialised device settings, logins, and remote registrations.

---

### 5. Cross-Component State Interactions & Side-Effects
Validates synchronization and side-effects across elements.
* **Required Fields Deletion vs. Submit Status**: Deleting invalid required fields clears error states and unlocks submit/proceed buttons.
* **Polymorphic Tab Selection vs. Form Values**: Switching polymorphic tabs (`anyOf`) replaces active field schemas and filters context payload formats.
* **File Dropping vs. Field Auto-Population**: Uploading files automatically populates files schema properties (e.g. `fileName`, `filetype`, `hash`) and clearing files resets them.
* **LDAP Login vs. Workspace State**: Login events triggerチーム tags queries, change user session greetings in the header navigation, and unlock lists options.
* **Specification Dropdown vs. Validator Compiler**: Modifying `$schema` specification triggers AJV validator engine compilations corresponding to standard drafts (draft-04 vs draft-07).
* **State-to-Download Integration Combinations**:
  * **Invalid Form Inputs blocking Export**: Inputting invalid required parameters blocks downloads and outputs toast error alerts.
  * **Valid Form Inputs triggering Export**: Valid parameters trigger schema validation success and initiate a `.json` file download.
  * **Element Deletion unblocking Export**: Deleting invalid required fields instantly resolves the validation block and runs the download.
  * **File DataURL vs. Description List format**: Uploading a file and exporting the description list translates base64 URL payloads to `<dd>See attachment (filename.ext)</dd>`.
  * **Schema Header/Element Modifications vs. Schema Export**: Editing schema titles, settings, or constraints and exporting downloads the modified JSON schema template with correct CryptoJS hash names.
* **Advanced Programmatic Integration Combinations**:
  * **`ErrorBoundary` Component Failure Isolation**: Renders fallback layouts and prints stack traces when child components throw unhandled errors.
  * **Autofill/Prefill recursively from Uploaded datasets**: Drops external metadata datasets to prefill form properties via recursive schema binding using `fillForm`.
  * **Session Lifecycle Transitions via AJAX mocks**: Simulates GET `/api/send_current_session` and POST `/logout` to assert that greetings and buttons toggle labels correctly.
  * **Toast Notifications Deduplication**: Asserts that sending multiple error toast calls with duplicate `toastId` markers displays only a single notification on JSDOM.

---

## Mocks Configuration (`src/tests/setup.js`)

Before running tests, the `setup.js` script installs mocks for non-JSDOM APIs:
* **JQuery**: Intercepts and mocks `$.ajax` calls.
* **URL**: Stubs `window.URL.createObjectURL` and `window.URL.revokeObjectURL`.
* **Toast**: Mocks notifications from `react-toastify`.

---

## Running the Tests

To run the full test suite once:
```bash
npm run test -- --run
```

To run tests in watch mode (interactive):
```bash
npm run test
```
