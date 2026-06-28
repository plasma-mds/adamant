/**
 * Factory function to create AdamantProcess or AdamantRequest component
 * This eliminates code duplication between two nearly-identical 1700+ line components
 * that only differ in variable naming (availableRequestSchemas vs availableExpSchemas, etc.)
 */

import React, { useCallback, useState } from "react";
import $ from "jquery";
import { useDropzone } from "react-dropzone";
import FormRenderer from "../components/FormRenderer";
import Button from "@material-ui/core/Button";
import { Route } from "react-router-dom";
import { IconButton, TextField } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import { FormContext } from "../FormContext";
import array2object from "../components/utils/array2object";
import object2array from "../components/utils/object2array";
import { Menu, MenuItem } from "@material-ui/core";
import DownloadIcon from "@material-ui/icons/GetApp";
import set from "set-value";
import getValue from "../components/utils/getValue";
import CryptoJS from "crypto-js";
import deleteKey from "../components/utils/deleteKey";
import validateAgainstSchema from "../components/utils/validateAgainstSchema";
import CreateELabFTWExperimentDialog from "../components/CreateELabFTWExperimentDialog";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import prepareDataForDescList from "../components/utils/prepareDataForDescList";
import array2objectAnyOf from "../components/utils/array2objectAnyOf";
import SchemaOne from "../schemas/all-types.json";
import SchemaTwo from "../schemas/demo-schema.json";
import SchemaThree from "../schemas/example-experiment-schema.json";
import SchemaFour from "../schemas/example-request-schema.json";
import SchemaFive from "../schemas/plasma-mds.json";
import SchemaSix from "../schemas/demo-schema-2019-09.json";
import SchemaSeven from "../schemas/demo-schema-2020-12.json";
import SchemaEight from "../schemas/demo-schema-draft-07.json";
import fillValueWithEmptyString from "../components/utils/fillValueWithEmptyString";
import convData2FormData from "../components/utils/convData2FormData";
import FormReviewBeforeSubmit from "../components/FormReviewBeforeSubmit";
import changeKeywords from "../components/utils/changeKeywords";
import QPTDATLogo from "../assets/adamant-header-5.svg";
import createDescriptionListFromJSON from "../components/utils/createDescriptionListFromJSON";
import HelpIcon from "@material-ui/icons/HelpOutlineRounded";
import { Tooltip } from "@material-ui/core";
import validateSchemaAgainstSpecification from "../components/utils/validateSchemaAgainstSpecification";
import LDAPLoginDialog from "../components/LDAPLoginDialog";
import DatasetSubmissionDialog from "../components/DatasetSubmissionDialog";
import AdamantVersion from "../assets/adamant_version.json";
import GeneralConfig from "../general-conf.json";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import FilesDialog from "../components/FilesDialog";

/**
 * Configuration for different page types
 */
const CONFIG = {
  process: {
    statePrefix: "exp", // experimentSchemas, setExperimentSchemas, etc.
    displayName: "AdamantProcess",
    contextTitle: "Processes",
  },
  request: {
    statePrefix: "req", // requestSchemas, setRequestSchemas, etc.
    displayName: "AdamantRequest",
    contextTitle: "Requests",
  },
};

/**
 * Factory function that creates either AdamantProcess or AdamantRequest component
 * @param {string} pageType - 'process' or 'request'
 * @returns {React.Component} The configured component
 */
export const createAdamantPageComponent = (pageType) => {
  const config = CONFIG[pageType];
  if (!config) {
    throw new Error(
      `Invalid pageType: ${pageType}. Must be 'process' or 'request'`
    );
  }

  // NOTE: The actual component implementation should be extracted from
  // AdamantProcess.jsx or AdamantRequest.jsx and parameterized here.
  // For now, this is a placeholder showing the approach.
  //
  // The original files are 1700+ lines and nearly identical except for:
  // - availableRequestSchemas → availableExpSchemas
  // - setAvailableRequestSchemas → setAvailableExpSchemas
  // - AdamantRequest → AdamantProcess (in JSX)
  // - requestSchemas → experimentSchemas
  // - requestSchemasTitle → experimentSchemasTitle
  //
  // Steps to complete this refactoring:
  // 1. Extract the core component logic from AdamantProcess.jsx
  // 2. Replace variable names with a parameter-based mapping
  // 3. Use this factory to create both components
  // 4. Update AdamantProcess.jsx and AdamantRequest.jsx to export factory results

  const displayName = config.displayName;

  // Placeholder: Return a wrapper that indicates this component should be created
  // by applying variable name replacements to the source file
  return function AdamantPage(props) {
    return <div>Refactoring in progress for {displayName}</div>;
  };
};

/**
 * RECOMMENDATION FOR COMPLETION:
 *
 * To fully implement this factory pattern:
 *
 * 1. Use a code generation approach or string templating to:
 *    - Read the base component from a template
 *    - Replace variable names based on config
 *    - Create component instances dynamically
 *
 * 2. OR manually extract the component and create a truly parameterized version:
 *    - Extract common component logic into createAdamantPageComponent
 *    - Pass config object to customize behavior
 *    - Remove ~1700 lines of duplication
 *
 * 3. Then update both files to import and use this factory:
 *    // AdamantProcess.jsx
 *    export default createAdamantPageComponent('process');
 *
 *    // AdamantRequest.jsx
 *    export default createAdamantPageComponent('request');
 *
 * This approach will:
 * - Eliminate 3400+ lines of duplicated code
 * - Make maintenance easier (single source of truth)
 * - Reduce bundle size significantly
 * - Allow reuse of the same logic for future pages
 */
