import React, { useCallback, useMemo, useRef, useState } from "react";
//import { makeStyles } from "@material-ui/core/styles";
import { useDropzone } from "react-dropzone";
import $ from "jquery";
//import QPTDATLogo from "../assets/header-image.png";
import FormRenderer from "../components/FormRenderer";
import Button from "@material-ui/core/Button";
import { TextField, Chip, ListSubheader, Popper, Paper, MenuList } from "@material-ui/core";
import CancelIcon from "@material-ui/icons/Cancel";
import { Autocomplete, createFilterOptions } from "@material-ui/lab";
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
import findFieldValueByKey from "../components/utils/findFieldValueByKey";
import sanitizeFilename from "../components/utils/sanitizeFilename";
import FormReviewBeforeSubmit from "../components/FormReviewBeforeSubmit";
import changeKeywords from "../components/utils/changeKeywords";
//import QPTDATLogo from "../assets/adamant-header-5.svg";
import QPTDATLogo from "../assets/adamant-header-5.svg";
import createDescriptionListFromJSON from "../components/utils/createDescriptionListFromJSON";
import validateSchemaAgainstSpecification from "../components/utils/validateSchemaAgainstSpecification";
import checkIDexistence from "../components/utils/checkIDexistence";

import ChooseUseCasesDialog from "../components/ChooseUseCasesDialog";
import ELabFTWLoginDialog from "../components/ELabFTWLoginDialog";
import DatasetSubmissionDialog from "../components/DatasetSubmissionDialog";
import NextCloudLoginDialog from "../components/NextCloudLoginDialog";
import NextCloudBrowseDialog from "../components/NextCloudBrowseDialog";
import NextCloudUploadFilenameDialog from "../components/NextCloudUploadFilenameDialog";
import GlobalLoadingIndicator from "../components/GlobalLoadingIndicator";
import ELabFTWBrowseDialog from "../components/ELabFTWBrowseDialog";
import LoadSchemaFromUrlDialog from "../components/LoadSchemaFromUrlDialog";

import AdamantVersion from "../assets/adamant_version.json";
import GeneralConfig from "../general-conf.json"
import { getRemembered, setRemembered, isRemembered } from "../components/utils/rememberableStorage";

// to create a bundle (download dataset+metadata as .zip)
import JSZip from "jszip";
import { saveAs } from "file-saver";
import FilesDialog from "../components/FilesDialog"

import ProgressDialog from "../components/ProgressDialog";



// function that receive the schema and convert it to Form/json data blueprint
// also to already put the default value to this blueprint
const createFormDataBlueprint = (schemaProperties) => {
  let newObject = {};

  Object.keys(schemaProperties).forEach((item) => {
    if (schemaProperties[item]["type"] !== "object") {
      if (schemaProperties[item]["default"] !== undefined) {
        newObject[item] = schemaProperties[item]["default"];
      } else if (
        (schemaProperties[item]["default"] === undefined) &
        (schemaProperties[item]["enum"] !== undefined)
      ) {
        newObject[item] = schemaProperties[item]["enum"][0];
      } else if (
        (schemaProperties[item]["type"] === "boolean") &
        (schemaProperties[item]["default"] === undefined)
      ) {
        newObject[item] = false;
      }
    } else {
      if (schemaProperties[item]["properties"] !== undefined) {
        newObject[item] = createFormDataBlueprint(
          schemaProperties[item]["properties"]
        );
      }
    }
  });

  return newObject;
};

// function to remove empty artributes
const isValEmpty = (val) => {
  if (val === "" || val === null || val === undefined) {
    return true;
  }
  if (typeof val === "object") {
    if (val instanceof Array) {
      return val.every(isValEmpty);
    }
    return Object.keys(val).every(k => isValEmpty(val[k]));
  }
  return false;
};

// function to remove empty attributes
const removeEmpty = (obj) => {
  if (obj instanceof Array) {
    obj.forEach((item) => {
      if (item && typeof item === "object") {
        removeEmpty(item);
      }
    });
    return obj;
  }

  Object.keys(obj).forEach((key) => {
    if (isValEmpty(obj[key])) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      removeEmpty(obj[key]);
    }
  });
  return Object.keys(obj).length > 0 || obj instanceof Array ? obj : undefined;
};

// text-filters each group's real options independently, then re-appends that group's own
// "Browse..." action row unconditionally at the end of its own block - keeps same-group entries
// contiguous (required by MUI's groupBy) while keeping the action row reachable even when the
// typed text matches nothing real in that group
const schemaOptionsFilter = createFilterOptions();
export const filterSchemaOptions = (options, state) => {
  const groupOrder = ["Default", "NextCloud", "eLabFTW", "Browse"];
  let result = [];
  groupOrder.forEach((group) => {
    const groupOpts = options.filter((option) => option.group === group);
    const actionOpts = groupOpts.filter((option) => option.isAction);
    const searchableOpts = groupOpts.filter((option) => !option.isAction);
    result = result.concat(schemaOptionsFilter(searchableOpts, state), actionOpts);
  });
  return result;
};

const AdamantMain = () => {
  // state management
  const [disable, setDisable] = useState(true);
  const [schemaMessage, setSchemaMessage] = useState(null);
  const [schemaValidity, setSchemaValidity] = useState(false);
  const [schema, setSchema] = useState(null);
  const [schemaIntermediate, setSchemaIntermediate] = useState(null);
  const [renderReady, setRenderReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [schemaList, setSchemaList] = useState([]);
  const [schemaNameList, setSchemaNameList] = useState([]);
  const [selectedSchemaName, setSelectedSchemaName] = useState("");
  const [originalSchema, setOriginalSchema] = useState();
  const [inputMode, setInputMode] = useState(false);
  const [convertedSchema, setConvertedSchema] = useState(null);
  const [createScratchMode, setCreateScratchMode] = useState(false);
  const [jsonData, setJsonData] = useState({});
  const [descriptionList, setDescriptionList] = useState("");
  const [schemaWithValues, setSchemaWithValues] = useState({});
  const [schemaSpecification, setSchemaSpecification] = useState("");
  const [token, setToken] = useState("");
  const [eLabURL, setELabURL] = useState(
    GeneralConfig["local-elab-url"]
  );
  const [experimentTitle, setExperimentTitle] = useState("");
  const [onlineMode, setOnlineMode] = useState(false);
  const [tags, setTags] = useState([]);
  const [retrievedTags, setRetrievedTags] = useState([]);
  const [SEMSelectedDevice, setSEMSelectedDevice] = useState("");
  const [HeaderImage, setHeaderImage] = useState(QPTDATLogo);
  const [openFormReviewDialog, setOpenFormReviewDialog] = useState(false);
  const [openJobRequestDialog, setOpenJobRequestDialog] = useState(false);
  const [openDatasetSubmissionDialog, setOpenDatasetSubmissionDialog] =
    useState(false);
  const [jobRequestSchemas, setJobRequestSchemas] = useState([]);
  const [submitTextList, setSubmitTextList] = useState([]);
  const [submitText, setSubmitText] = useState("Submit Job Request");
  const [openUseCasesDialog, setOpenUseCasesDialog] = useState(true);
  const [openELabFTWLoginDialog, setOpenELabFTWLoginDialog] = useState(false);
  const [loginState, setLoginState] = useState("false");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  // "Remember me": persist the login (email + API token) in localStorage across browser
  // restarts instead of only sessionStorage. Opt-in, defaults to whatever was chosen last time.
  const [rememberElab, setRememberElab] = useState(() => isRemembered("token"));

  // external eLabFTW connection (a separate, user-supplied instance, distinct from the
  // pre-configured internal one above). Both share the single openELabFTWLoginDialog entry
  // point above - only one of internal/external can ever be the active connection, see
  // handleLogin/handleExternalLogin.
  const [externalElabUrl, setExternalElabUrl] = useState("");
  const [externalToken, setExternalToken] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalFirstName, setExternalFirstName] = useState("");
  const [externalLoginState, setExternalLoginState] = useState("false");
  const [rememberExternalElab, setRememberExternalElab] = useState(() => isRemembered("externalToken"));

  // NextCloud connection
  const [openNextCloudLoginDialog, setOpenNextCloudLoginDialog] = useState(false);
  const [openNextCloudBrowseDialog, setOpenNextCloudBrowseDialog] = useState(false);
  const [nextCloudBrowseMode, setNextCloudBrowseMode] = useState("pick-file");
  const ncUrl = GeneralConfig["nextcloud-url"];
  const [ncUsername, setNcUsername] = useState("");
  const [ncAppPassword, setNcAppPassword] = useState("");
  const [rememberNc, setRememberNc] = useState(() => isRemembered("ncAppPassword"));
  const [ncDisplayName, setNcDisplayName] = useState("");
  const [ncLoginState, setNcLoginState] = useState("false");

  // confirm/edit the URN-derived file name before actually uploading to NextCloud
  const [openNcUploadFilenameDialog, setOpenNcUploadFilenameDialog] = useState(false);
  const [ncUploadTargetPath, setNcUploadTargetPath] = useState("");
  const [ncUploadFilename, setNcUploadFilename] = useState("");
  const [ncUploadSchemaFilename, setNcUploadSchemaFilename] = useState("");
  // once the user edits the schema file name directly, stop overwriting it as the
  // metadata file name changes - their own choice takes precedence from then on
  const [ncUploadSchemaFilenameTouched, setNcUploadSchemaFilenameTouched] = useState(false);

  // select schema combobox (Default vs NextCloud vs eLabFTW)
  const [ncSchemaEntries, setNcSchemaEntries] = useState([]);
  const [ncSchemaListLoading, setNcSchemaListLoading] = useState(false);
  const [elabSchemaEntries, setElabSchemaEntries] = useState([]);
  const [elabSchemaListLoading, setElabSchemaListLoading] = useState(false);
  // covers other slow foreground operations that don't have their own dedicated flag:
  // fetching+applying a NextCloud/eLabFTW/URL schema, and uploading a dataset to NextCloud
  // (the "hovering NextCloud/eLabFTW" list loads are covered by the two flags above instead)
  const [asyncOperationLoading, setAsyncOperationLoading] = useState(false);
  const [elabSchemaItemId, setElabSchemaItemId] = useState(null);
  const [selectedSchemaOption, setSelectedSchemaOption] = useState(null);
  const [hoveredSchemaGroup, setHoveredSchemaGroup] = useState(null);
  const [schemaSearchText, setSchemaSearchText] = useState("");
  const [schemaComboboxOpen, setSchemaComboboxOpen] = useState(false);
  const [openElabBrowseDialog, setOpenElabBrowseDialog] = useState(false);
  const [openExternalElabBrowseDialog, setOpenExternalElabBrowseDialog] = useState(false);
  const [openLoadSchemaFromUrlDialog, setOpenLoadSchemaFromUrlDialog] = useState(false);
  const [schemaUrlInput, setSchemaUrlInput] = useState("");
  // for dropdown buttons
  const [anchorEl, setAnchorEl] = useState(null);
  const [connectMenuAnchorEl, setConnectMenuAnchorEl] = useState(null);
  const [
    openCreateElabFTWExperimentDialog,
    setOpenCreateElabFTWExperimentDialog,
  ] = useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }; //

  // loaded files object
  const [loadedFiles, setLoadedFiles] = useState([]);

  // FilesDialog
  const [openFilesDialog, setOpenFilesDialog] = useState(false);
  const [filesDialogContent, setFilesDialogContent] = useState(["", "", ""]);

  // ProgressDialog
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [progressDialogMessages, setProgressDialogMessages] = useState([
    "",
    "",
  ]);
  const [progress, setProgress] = useState(0);
  const [progressDialogTitle, setProgressDialogTitle] = useState("");

  // blockchain
  const [hashes, setHashes] = useState({});

  //-------------------------- useEffects to save states between reloads ----------------------------

  useEffect(() => {
    const rememberedLoginState = getRemembered("loginState") ?? "false";
    const rememberedExternalLoginState = getRemembered("externalLoginState") ?? "false";

    setFirstName(getRemembered("firstName") ?? "");
    setToken(getRemembered("token") ?? "");
    setLoginState(rememberedLoginState);
    setEmail(getRemembered("email") ?? "");
    setNcUsername(getRemembered("ncUsername") ?? "");
    setNcAppPassword(getRemembered("ncAppPassword") ?? "");
    setNcDisplayName(getRemembered("ncDisplayName") ?? "");
    setNcLoginState(getRemembered("ncLoginState") ?? "false");
    setExternalElabUrl(getRemembered("externalElabUrl") ?? "");
    setExternalToken(getRemembered("externalToken") ?? "");
    setExternalEmail(getRemembered("externalEmail") ?? "");
    setExternalFirstName(getRemembered("externalFirstName") ?? "");
    // only one of internal/external eLabFTW can be the active connection - if both were
    // remembered (e.g. from before this restriction existed), the internal one wins
    setExternalLoginState(rememberedLoginState === "true" ? "false" : rememberedExternalLoginState);
  }, []);

  useEffect(() => {
    setRemembered("firstName", firstName, rememberElab);
    setRemembered("token", token, rememberElab);
    setRemembered("loginState", loginState, rememberElab);
    setRemembered("email", email, rememberElab);
  }, [firstName, token, loginState, email, rememberElab]);

  useEffect(() => {
    setRemembered("externalElabUrl", externalElabUrl, rememberExternalElab);
    setRemembered("externalToken", externalToken, rememberExternalElab);
    setRemembered("externalEmail", externalEmail, rememberExternalElab);
    setRemembered("externalFirstName", externalFirstName, rememberExternalElab);
    setRemembered("externalLoginState", externalLoginState, rememberExternalElab);
  }, [externalElabUrl, externalToken, externalEmail, externalFirstName, externalLoginState, rememberExternalElab]);

  useEffect(() => {
    setRemembered("ncUsername", ncUsername, rememberNc);
    setRemembered("ncAppPassword", ncAppPassword, rememberNc);
    setRemembered("ncDisplayName", ncDisplayName, rememberNc);
    setRemembered("ncLoginState", ncLoginState, rememberNc);
  }, [ncUsername, ncAppPassword, ncDisplayName, ncLoginState, rememberNc]);
  //-------------------------------------------------------------------------------------------------

  let implementedFieldTypes = [
    "string",
    "number",
    "integer",
    "array",
    "boolean",
    "object",
  ];

  // check if the front-end is connected to backend at all
  useEffect(() => {
    $.ajax({
      type: "GET",
      url: "/api/check_mode",
      success: function (status) {
        console.log("Connection to server is established. Online mode");
        setJobRequestSchemas(status["jobRequestSchemaList"]);
        console.log(status["jobRequestSchemaList"]);
        setSubmitTextList(status["submitButtonText"]);
        setOnlineMode(true);
        toast.success(
          <>
            <div>
              <strong>Connection to server is established.</strong>
            </div>
          </>,
          {
            toastId: "connectionSuccess",
          }
        );
      },
      error: function () {
        console.log(
          "Unable to establish connection to server. Offline mode. Submit feature is disabled."
        );
        setOnlineMode(false);

        // use available schema as a place holder
        setSchemaNameList([
          "",
          "all-types.json",
          "demo-schema.json",
          "example-experiment-schema.json",
          "example-request-schema.json",
          "plasma-mds.json",
          "demo-schema-2019-09.json",
          "demo-schema-2020-12.json",
          "demo-schema-draft-07.json",
        ]);
        setSchemaList([
          null,
          SchemaOne,
          SchemaTwo,
          SchemaThree,
          SchemaFour,
          SchemaFive,
          SchemaSix,
          SchemaSeven,
          SchemaEight,
        ]);

        toast.warning(
          <>
            <div>
              <strong>Unable to establish connection to server.</strong>
            </div>
            <div>Submit feature is disabled.</div>
          </>,
          {
            toastId: "connectionWarning",
          }
        );
      },
    });
  }, []);

  // get schemas from server when onlinemode is true
  useEffect(() => {
    // if online mode then get available schemas from server
    if (onlineMode === true) {
        $.ajax({
        type: "GET",
        url: "/api/get_schemas",
        success: function (status) {
          console.log("SUCCESS");

          // do this to preserver the order
          let sch = [];
          status["schema"].forEach((element) => {
            sch.push(JSON.parse(element));
          });

          setSchemaList(sch);
          setSchemaNameList(status["schemaName"]);
        },
        error: function () {
          console.log("ERROR");
          toast.warning(
            "Error while fetching the schemas. Using basic list of schemas.",
            {
              toastId: "fetchingSchemasError",
            }
          );
          // if unable to fetch the schemas then use the basic list of schemas
          setSchemaNameList([
            "",
            "all-types.json",
            "demo-schema.json",
            "example-experiment-schema.json",
            "example-request-schema.json",
            "plasma-mds.json",
            "demo-schema-2019-09.json",
            "demo-schema-2020-12.json",
            "demo-schema-draft-07.json",
          ]);
          setSchemaList([
            null,
            SchemaOne,
            SchemaTwo,
            SchemaThree,
            SchemaFour,
            SchemaFive,
            SchemaSix,
            SchemaSeven,
            SchemaEight,
          ]);
        },
      });
    }
  }, [onlineMode]);

  // handle login
  const handleLogin = () => {
    $.ajax({
      type: "POST",
      url: "/api/login",
      dataType: "json",
      data: {
        email: email,
        eLabToken: token,
        elabUrl: GeneralConfig["local-elab-url"]
      },
      success: function (status) {
        if (status["status"] === 400) {
          console.log("Log in failed!");
          console.log(status);
          toast.error(`Failed to log you in!\nUser e-mail not found.`, {
            toastId: "loginFailed",
          });
        } else {
          console.log("Login sucessful!");
          setRetrievedTags(status);
          toast.success(`Successfully logged in!`, {
            toastId: "loginSuccess",
          });
          setOpenELabFTWLoginDialog(false);
          setLoginState("true");
          setFirstName(status["firstname"]);
          // only one of internal/external eLabFTW can be connected at a time
          if (externalLoginState === "true") {
            handleExternalLogOut();
          }
        }
      },
      error: function (status) {
        console.log("Log in failed!");
        console.log(status);
        toast.error(`Failed to log you in!\nIs the server working properly? Or maybe wrong token?`, {
          toastId: "loginFailed",
        });
      },
    });
  };

  // logging out only ends the active session (loginState); email/token stay saved (in
  // whichever storage the "remember me" choice put them in) so the login dialog reopens
  // pre-filled and reconnecting is just a click, not a retype
  const handleLogOut = () => {
    setLoginState("false");

    setElabSchemaEntries([]);
    setElabSchemaItemId(null);
  };

  // handle login to an external, user-specified eLabFTW instance (reuses /api/login,
  // which already takes elabUrl as a per-request param rather than a config constant)
  const handleExternalLogin = () => {
    $.ajax({
      type: "POST",
      url: "/api/login",
      dataType: "json",
      data: {
        email: externalEmail,
        eLabToken: externalToken,
        elabUrl: externalElabUrl,
      },
      success: function (status) {
        if (status["status"] === 400) {
          console.log("External log in failed!");
          console.log(status);
          toast.error(`Failed to log you in!\nUser e-mail not found.`, {
            toastId: "externalLoginFailed",
          });
        } else {
          console.log("External login successful!");
          toast.success(`Successfully logged in!`, {
            toastId: "externalLoginSuccess",
          });
          setOpenELabFTWLoginDialog(false);
          setExternalLoginState("true");
          setExternalFirstName(status["firstname"]);
          // only one of internal/external eLabFTW can be connected at a time
          if (loginState === "true") {
            handleLogOut();
          }
        }
      },
      error: function (status) {
        console.log("External log in failed!");
        console.log(status);
        toast.error(`Failed to log you in!\nIs the server working properly? Or maybe wrong URL/token?`, {
          toastId: "externalLoginFailed",
        });
      },
    });
  };

  const handleExternalLogOut = () => {
    setExternalLoginState("false");
  };

  // handle NextCloud login
  const handleNextCloudLogin = () => {
    $.ajax({
      type: "POST",
      url: "/api/nextcloud/login",
      dataType: "json",
      data: {
        ncUrl: ncUrl,
        ncUsername: ncUsername,
        ncAppPassword: ncAppPassword,
      },
      success: function (status) {
        if (status["status"] !== 200) {
          console.log("NextCloud login failed!", status);
          toast.error(status["message"] || "Failed to connect to NextCloud!", {
            toastId: "ncLoginFailed",
          });
        } else {
          console.log("NextCloud connection successful!");
          toast.success(`Successfully connected to NextCloud!`, {
            toastId: "ncLoginSuccess",
          });
          setOpenNextCloudLoginDialog(false);
          setNcLoginState("true");
          setNcDisplayName(status["displayname"]);
        }
      },
      error: function (status) {
        console.log("NextCloud login failed!", status);
        toast.error(`Failed to connect to NextCloud!\nIs the server URL correct?`, {
          toastId: "ncLoginFailed",
        });
      },
    });
  };

  const handleNextCloudLogOut = () => {
    setNcLoginState("false");

    setNcSchemaEntries([]);
  };

  // fetch the list of schemas available under the configured NextCloud schemas folder
  const loadNextCloudSchemaList = () => {
    setNcSchemaListLoading(true);
    $.ajax({
      type: "POST",
      url: "/api/nextcloud/list",
      dataType: "json",
      data: { ncUrl, ncUsername, ncAppPassword, path: GeneralConfig["nextcloud-schemas-folder-path"] },
      success: function (status) {
        setNcSchemaListLoading(false);
        if (status["status"] !== 200) {
          toast.error(status["message"] || "Unable to list schemas from NextCloud.", {
            toastId: "ncSchemaListError",
          });
          setNcSchemaEntries([]);
          return;
        }
        setNcSchemaEntries(
          status["entries"].filter(
            (entry) => !entry["isFolder"] && entry["name"].toLowerCase().endsWith(".json")
          )
        );
      },
      error: function () {
        setNcSchemaListLoading(false);
        toast.error("Unable to list schemas from NextCloud.", {
          toastId: "ncSchemaListError",
        });
        setNcSchemaEntries([]);
      },
    });
  };

  // fetch the list of schemas available in the eLabFTW "schemas" item
  const loadELabSchemaList = () => {
    setElabSchemaListLoading(true);
    $.ajax({
      type: "POST",
      url: "/api/elab/schemas_list",
      dataType: "json",
      data: {
        eLabURL,
        eLabToken: token,
        folderName: GeneralConfig["elab-internal-schemas-folder-name"],
      },
      success: function (status) {
        setElabSchemaListLoading(false);
        if (status["status"] !== 200) {
          toast.error(status["message"] || "Unable to list schemas from eLabFTW.", {
            toastId: "elabSchemaListError",
          });
          setElabSchemaEntries([]);
          return;
        }
        setElabSchemaItemId(status["itemId"]);
        setElabSchemaEntries(status["entries"]);
      },
      error: function () {
        setElabSchemaListLoading(false);
        toast.error("Unable to list schemas from eLabFTW.", {
          toastId: "elabSchemaListError",
        });
        setElabSchemaEntries([]);
      },
    });
  };

  // load a schema selected from eLabFTW (combobox quick-search or the browse dialog)
  const handleELabSchemaSelected = (entry, itemId) => {
    setAsyncOperationLoading(true);
    $.ajax({
      type: "POST",
      url: "/api/elab/schemas_read",
      dataType: "json",
      data: {
        eLabURL,
        eLabToken: token,
        itemId,
        uploadId: entry["id"],
      },
      success: function (obj) {
        if (obj["status"] === 500) {
          setAsyncOperationLoading(false);
          toast.error(obj["message"] || "Unable to read this schema from eLabFTW.", {
            toastId: "elabReadError",
          });
          return;
        }

        setSelectedSchemaName("");
        applySchemaToState(obj, entry["name"]);
      },
      error: function () {
        setAsyncOperationLoading(false);
        toast.error("Unable to read this schema from eLabFTW.", {
          toastId: "elabReadError",
        });
      },
    });
  };

  // load a schema selected from an external eLabFTW instance's browse dialog
  const handleExternalELabSchemaSelected = (entry, itemId) => {
    setAsyncOperationLoading(true);
    $.ajax({
      type: "POST",
      url: "/api/elab/schemas_read",
      dataType: "json",
      data: {
        eLabURL: externalElabUrl,
        eLabToken: externalToken,
        itemId,
        uploadId: entry["id"],
      },
      success: function (obj) {
        if (obj["status"] === 500) {
          setAsyncOperationLoading(false);
          toast.error(obj["message"] || "Unable to read this schema from eLabFTW.", {
            toastId: "elabExternalReadError",
          });
          return;
        }

        setSelectedSchemaName("");
        applySchemaToState(obj, entry["name"]);
      },
      error: function () {
        setAsyncOperationLoading(false);
        toast.error("Unable to read this schema from eLabFTW.", {
          toastId: "elabExternalReadError",
        });
      },
    });
  };

  // load a schema selected from the NextCloud browser
  const handleNextCloudSchemaSelected = (path) => {
    setAsyncOperationLoading(true);
    $.ajax({
      type: "POST",
      url: "/api/nextcloud/read",
      dataType: "json",
      data: { ncUrl, ncUsername, ncAppPassword, path },
      success: function (obj) {
        if (obj["status"] === 500) {
          setAsyncOperationLoading(false);
          toast.error(obj["message"] || "Unable to read this schema from NextCloud.", {
            toastId: "ncReadError",
          });
          return;
        }

        setSelectedSchemaName("");
        applySchemaToState(obj, path);
      },
      error: function () {
        setAsyncOperationLoading(false);
        toast.error("Unable to read this schema from NextCloud.", {
          toastId: "ncReadError",
        });
      },
    });
  };

  // fetch and apply a JSON schema from an arbitrary, user-supplied URL
  const handleLoadSchemaFromUrl = () => {
    setAsyncOperationLoading(true);
    $.ajax({
      type: "POST",
      url: "/api/load_schema_from_url",
      dataType: "json",
      data: { url: schemaUrlInput },
      success: function (obj) {
        if (obj["status"] !== 200) {
          setAsyncOperationLoading(false);
          toast.error(obj["message"] || "Unable to fetch or parse a JSON schema from that URL.", {
            toastId: "loadSchemaFromUrlError",
          });
          return;
        }

        setOpenLoadSchemaFromUrlDialog(false);
        setSelectedSchemaName("");
        applySchemaToState(obj["schema"], schemaUrlInput);
        setSchemaUrlInput("");
      },
      error: function () {
        setAsyncOperationLoading(false);
        toast.error("Unable to fetch or parse a JSON schema from that URL.", {
          toastId: "loadSchemaFromUrlError",
        });
      },
    });
  };

  // after picking a NextCloud destination folder, derive a filename from the form's "URN"
  // field (if any) and let the user confirm/edit it before the actual upload happens
  const handleNextCloudFolderSelected = (targetPath) => {
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }

    const urnValue = findFieldValueByKey(content, "URN");
    const derivedName = sanitizeFilename(urnValue) || "metadata";

    setNcUploadTargetPath(targetPath);
    setNcUploadFilename(`${derivedName}.json`);
    setNcUploadSchemaFilename(`${derivedName}-schema.json`);
    setNcUploadSchemaFilenameTouched(false);
    setOpenNcUploadFilenameDialog(true);
  };

  // "<name>-schema.json" derived from the metadata file name, stripping its own .json first
  const deriveSchemaFilenameFrom = (metadataFilename) =>
    `${metadataFilename.replace(/\.json$/i, "")}-schema.json`;

  // keep the schema file name mirroring the metadata one, unless the user has directly
  // edited the schema file name field (see ncUploadSchemaFilenameTouched)
  const handleNcUploadFilenameChange = (newValue) => {
    setNcUploadFilename(newValue);
    if (!ncUploadSchemaFilenameTouched) {
      setNcUploadSchemaFilename(deriveSchemaFilenameFrom(newValue));
    }
  };

  const handleNcUploadSchemaFilenameChange = (newValue) => {
    setNcUploadSchemaFilename(newValue);
    setNcUploadSchemaFilenameTouched(true);
  };

  // upload the filled-in dataset to NextCloud, using the confirmed/edited file name
  const handleSubmitDatasetToNextCloud = () => {
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    let contentSchema = { ...schema };

    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }

    const metadataFilename = sanitizeFilename(ncUploadFilename) || "metadata.json";
    const schemaFilename = sanitizeFilename(ncUploadSchemaFilename) || "schema.json";

    let formData = new FormData();
    formData.append("ncUrl", ncUrl);
    formData.append("ncUsername", ncUsername);
    formData.append("ncAppPassword", ncAppPassword);
    formData.append("targetPath", ncUploadTargetPath);
    formData.append("metadataFilename", metadataFilename);
    formData.append("schemaFilename", schemaFilename);
    formData.append("metadata", JSON.stringify(content));
    formData.append("schema", JSON.stringify(contentSchema));
    for (let i = 0; i < loadedFiles.length; i++) {
      formData.append("files", loadedFiles[i], loadedFiles[i]["name"]);
    }

    setAsyncOperationLoading(true);
    $.ajax({
      type: "POST",
      url: "/api/nextcloud/upload",
      data: formData,
      processData: false,
      contentType: false,
      success: function (status) {
        setAsyncOperationLoading(false);
        if (status["status"] !== 200) {
          toast.error(status["message"] || "Unable to upload the dataset to NextCloud.", {
            toastId: "ncUploadError",
          });
          return;
        }
        toast.success("Dataset uploaded to NextCloud!", { toastId: "ncUploadSuccess" });
        setOpenNcUploadFilenameDialog(false);
      },
      error: function () {
        setAsyncOperationLoading(false);
        toast.error("Unable to upload the dataset to NextCloud.", {
          toastId: "ncUploadError",
        });
      },
    });
  };

  // apply a fetched/parsed schema object to app state, regardless of its source
  const applySchemaToState = (rawSchema, schemaLabel) => {
    setRenderReady(false);
    setDisable(true);
    setCreateScratchMode(false);
    setJsonData({});

    let convertedSchema = JSON.parse(JSON.stringify(rawSchema));
    try {
      convertedSchema["properties"] = object2array(
        rawSchema["properties"],
        rawSchema
      );

      setSchemaValidity(true);
      setSchemaMessage(`${schemaLabel} is a valid schema`);
      setSchema(rawSchema);
      let oriSchema = JSON.parse(JSON.stringify(rawSchema));
      setOriginalSchema(oriSchema);
      setSchemaWithValues(JSON.parse(JSON.stringify(oriSchema)));
      setConvertedSchema(convertedSchema);
      setDisable(false);
      setRenderReady(true);
      setHeaderImage(QPTDATLogo);

      if (jobRequestSchemas.includes(convertedSchema["title"])) {
        setSubmitText(
          submitTextList[jobRequestSchemas.indexOf(convertedSchema["title"])]
        );
      }
      setEditMode(false);

      let formData = createFormDataBlueprint(rawSchema["properties"]);
      setJsonData(formData);
    } catch (error) {
      console.log(error);
      setSchemaValidity(false);
      setSchemaMessage(`${schemaLabel} is invalid`);
      setSchema(null);
    }
    setAsyncOperationLoading(false);
  };

  // handle select schema on change
  const handleSelectSchemaOnChange = (schemaName) => {
    if (schemaName === null) {
      clearSchemaOnClick();

      return;
    }

    console.log("selected schema:", schemaName);
    setSelectedSchemaName(schemaName);

    let selectedSchema = schemaList[schemaNameList.indexOf(schemaName)];

    // reset everything when selectedSchema is empty
    if (selectedSchema === null) {
      setDisable(true);
      setRenderReady(false);
      setSchema(null);
      setSchemaValidity(false);
      setSchemaMessage();
      setCreateScratchMode(false);
      setJsonData({});
      return;
    }

    applySchemaToState(selectedSchema, schemaName);
  };

  // function to check if the file accepted is of json format and json schema valid
  const checkSchemaValidity = (schemaFile) => {
    // place holder
    if (schemaFile[0]["type"] === "application/json") {
      // read the file with FileReadr API
      const reader = new FileReader();
      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        const binaryStr = reader.result;
        const obj = JSON.parse(binaryStr);
        applySchemaToState(obj, schemaFile[0]["name"]);
      };
      reader.readAsText(schemaFile[0]);
    } else {
      // update states
      setSchemaValidity(false);
      setSchemaMessage(`${schemaFile[0]["name"]} is of incorrect file type`);
      setSchema(null);
    }
  };

  // browse or drag&drop schema file
  const onDrop = useCallback(
    (acceptedFile) => {
      // process the schema, validation etc
      checkSchemaValidity(acceptedFile);

      // store schema file in the state
      // update states
      setRenderReady(false);
      setDisable(true);
      setCreateScratchMode(false);
      setJsonData({});
      setSelectedSchemaName("");
    },
    [setRenderReady, jobRequestSchemas, submitTextList]
  );
  //

  const { getInputProps, open: openLocalFilePicker } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // render on-click handle
  const renderOnClick = () => {
    //setFormRenderInProgress(true);
    setDisable(false);
    setRenderReady(true);
  };

  // clear schema on-click handle
  const clearSchemaOnClick = () => {
    setHeaderImage(QPTDATLogo);
    setDisable(true);
    setRenderReady(false);
    setSchema(null);
    setSchemaValidity(false);
    setSchemaMessage();
    setCreateScratchMode(false);
    setSelectedSchemaName("");
  };

  // create new schema from scratch
  const createSchemaFromScratch = () => {
    // update browse schema render states
    setSchemaValidity(false);
    setSchemaMessage();
    setJsonData({});
    setSelectedSchemaName("");

    // always use newer schema specification
    let schemaBlueprint = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {},
    };
    const obj = JSON.parse(JSON.stringify(schemaBlueprint));

    // create form data again
    let formData = createFormDataBlueprint(obj["properties"]);
    setJsonData(formData);

    // convert obj schema to iterable array properties
    let convertedSchema = JSON.parse(JSON.stringify(obj));
    convertedSchema["properties"] = object2array(obj["properties"], obj);

    // update states
    setCreateScratchMode(true);
    setSchema(obj);
    let oriSchema = JSON.parse(JSON.stringify(obj));
    setOriginalSchema(oriSchema);
    setSchemaWithValues(JSON.parse(JSON.stringify(oriSchema)));
    setConvertedSchema(convertedSchema);

    if (jobRequestSchemas.includes(obj["title"])) {
      try {
        //setHeaderImage(SEMlogo["default"]);
        setHeaderImage(QPTDATLogo);
        setEditMode(true);
        setSubmitText(
          submitTextList[jobRequestSchemas.findIndex(convertedSchema["title"])]
        );
      } catch (error) {
        console.log(error);
        setHeaderImage(QPTDATLogo);
        setEditMode(false);
      }
    } else {
      setHeaderImage(QPTDATLogo);
      setEditMode(false);
    }

    setDisable(false);
    setRenderReady(true);
    setEditMode(true);
  };

  // compile on-click handle
  const compileOnClick = () => {
    let value = schema;

    const [valid, message] = validateSchemaAgainstSpecification(
      JSON.parse(JSON.stringify(schema)),
      schemaSpecification
    );
    if (valid) {
      setInputMode(true);
      setSchema(value);
      setEditMode(true);
      setDisable(true);
    } else {
      toast.error(
        <>
          <div>
            <strong>Your schema is not valid.</strong>
          </div>
          {message}
        </>,
        {
          toastId: "schemaError",
        }
      );
      return;
    }
  };

  // return to edit mode handle
  const toEditMode = () => {
    let value = schema;
    if (jobRequestSchemas.includes(schema["title"])) {
      setInputMode(false);
      setSchema(value);
      setEditMode(true);
      setDisable(false);
    } else {
      setInputMode(false);
      setSchema(value);
      setEditMode(false);
      setDisable(false);
    }
  };

  // update parent (re-render everything)
  const updateParent = (value) => {
    let newValue = JSON.parse(JSON.stringify(value));

    if (newValue["$schema"] === "http://json-schema.org/draft-04/schema#") {
      changeKeywords(newValue, "$id", "id");
    } else {
      changeKeywords(newValue, "id", "$id");
    }

    // update original schema
    let updatedSchema = JSON.parse(JSON.stringify(newValue));
    let tempSchema = JSON.parse(JSON.stringify(newValue));
    updatedSchema["properties"] = array2object(tempSchema["properties"]);

    setConvertedSchema(newValue);
    setSchema(updatedSchema);

    // update intermediate schema
    let updatedSchema2 = JSON.parse(JSON.stringify(newValue));
    let tempSchema2 = JSON.parse(JSON.stringify(newValue));
    updatedSchema2["properties"] = array2objectAnyOf(tempSchema2["properties"]);
    setSchemaIntermediate(updatedSchema2);
  };

  // update error stuff visually after validation (if some field(s) is are invalid)
  const setErrorStuffUponValidation = (errorMessages) => {
    let value = { ...convertedSchema };
    errorMessages.forEach((message) => {
      let path = message.path;
      path = path.split(".");
      let newPath = [];
      let tempValue = JSON.parse(JSON.stringify(value));
      for (let i = 0; i < path.length; ) {
        if (path[i] === "items" && tempValue[path[i]]["type"] === "object") {
          set(value, newPath.join(".") + ".adamant_field_error", true);
          set(
            value,
            newPath.join(".") + ".adamant_error_description",
            "One or more fields in this array have invalid inputs. Please fix them."
          );
          return;
        }
        if (
          path[i] === "properties" &&
          Array.isArray(tempValue["properties"])
        ) {
          newPath.push(path[i]);
          i += 1;
          let index = tempValue["properties"].findIndex(
            (val) => val.fieldKey === path[i]
          );
          newPath.push(index);
          i += 1;
          tempValue = tempValue["properties"][index];
        } else {
          newPath.push(path[i]);
          tempValue = tempValue[path[i]];
          i += 1;
        }
      }
      //console.log(newPath.join("."));
      set(value, newPath.join(".") + ".adamant_field_error", true);
      set(
        value,
        newPath.join(".") + ".adamant_error_description",
        message.message
      );
    });

    updateParent(value);
  };

  // revert all changes to the schema
  const revertAllChanges = () => {
    let value = { ...originalSchema };
    // convert obj schema to iterable array properties
    let convertedSchema = JSON.parse(JSON.stringify(value));
    convertedSchema["properties"] = object2array(value["properties"], value);
    console.log(convertedSchema);
    setConvertedSchema(convertedSchema);
    setSchema(value);
    setSchemaWithValues(value);
    setDescriptionList("");

    // create form data again
    let formData = createFormDataBlueprint(value["properties"]);
    setJsonData(formData);
  };

  /*/ handle data input on blur
  const handleDataInput = (event, path, type) => {
    let jData = { ...jsonData };
    let value;
    if (["string", "number", "integer", "boolean"].includes(type)) {
      if (["number", "integer", "boolean"].includes(type)) {
        value = event;
      } else {
        value = event.target.value;
      }
    } else if (type === "array") {
      value = event;
    }
    set(jData, path, value);
    //console.log("Current form data    (jData):", jData);
    setJsonData(jData);
  };
  /*/

  // handle data input on blur to convertedSchema
  const handleConvertedDataInput = (event, path, type) => {
    let convSchemaData = { ...convertedSchema };
    let value;
    if (["string", "number", "integer", "boolean"].includes(type)) {
      if (["number", "integer", "boolean"].includes(type)) {
        value = event;
      } else {
        value = event.target.value;
      }
    } else if (type === "array") {
      value = event;
    }
    set(convSchemaData, path, value);
    setConvertedSchema(convSchemaData);
    console.log(convSchemaData);

    let data = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );

    setJsonData(data);

    // convert to form data
    console.log("Current form data (convData):", data);

    // unconverted
    //console.log("Current form data (unconverted convData):", convSchemaData);
  };

  // delete data in jsonData when the field in schema is deleted
  const handleDataDelete = (path) => {
    console.log("path", path);
    console.log(jsonData);
    let jData = { ...jsonData };
    let value = deleteKey(jData, path);
    setJsonData(value);
    console.log("Current form data:", value);
  };

  // handle check if id already exists in the schema
  const handleCheckIDexistence = (id) => {
    let result = false;
    result = checkIDexistence(schema, id, result);
    return result;
  };

  // update form data id if a fieldkey changes, simply delete key value pair of the oldfieldid from jsonData
  const updateFormDataId = (
    oldFieldId,
    newFieldId,
    pathFormData,
    defaultValue
  ) => {
    if (oldFieldId === newFieldId) {
      return;
    }
    if (defaultValue === undefined) {
      let jData = { ...jsonData };
      jData = deleteKey(jData, pathFormData);
      setJsonData(jData);
      console.log("Current form data:", jData);
    } else {
      let newPathFormData = pathFormData.split(".");
      newPathFormData.pop();
      newPathFormData.push(newFieldId);

      let jData = { ...jsonData };
      let value = getValue(jData, pathFormData);
      set(jData, newPathFormData, value);
      jData = deleteKey(jData, pathFormData);
      setJsonData(jData);
      console.log("Current form data:", jData);
    }
  };

  // handle download json schema
  const handleDownloadJsonSchema = () => {
    let content = { ...schema };

    // calculate hash for the content
    // calculate hash using CryptoJS
    let sha256_hash = CryptoJS.SHA256(JSON.stringify(content));

    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    a.href = URL.createObjectURL(file);
    a.download = `jsonschema-${sha256_hash}.json`;
    a.click();

    handleClose();
  };

  // handle download json schema
  const handleDownloadFormData = () => {
    //let content = { ...jsonData };
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    let contentSchema = { ...schema };

    // get rid of empty values in content
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }
    console.log("content", content);

    //
    // validate jsonData against its schema before download
    //
    const [valid, messages] = validateAgainstSchema(content, contentSchema);
    setErrorStuffUponValidation(messages);
    if (!valid || (Object.keys(content).length === 0)) {
      toast.error(
        <>
          <div>
            <strong>Form data is not valid.</strong>
          </div>
          <div style={{ paddingBottom: "10px" }}>Check your inputs!</div>
          {messages.map((item, index) => {
            return <div key={index}>{index + 1 + ". " + item.message}</div>;
          })}
        </>,
        {
          autoClose: 10000,
          toastId: "formDataError",
        }
      );
      handleClose();
      return;
    }

    // calculate hash for the content
    // calculate hash using CryptoJS
    let sha256_hash = CryptoJS.SHA256(JSON.stringify(content));

    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    a.href = URL.createObjectURL(file);
    a.download = `formdata-${sha256_hash}.json`;
    a.click();

    handleClose();
  };

  // handle download json schema
  const handleDownloadDescriptionList = () => {
    //let content = { ...jsonData };
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    let contentSchema = { ...schema };

    // get rid of empty values in content
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }

    //
    // validate jsonData against its schema before download
    //
    const [valid, messages] = validateAgainstSchema(content, contentSchema);
    setErrorStuffUponValidation(messages);
    if (!valid || (Object.keys(content).length === 0)) {
      toast.error(
        <>
          <div>
            <strong>Form data is not valid.</strong>
          </div>
          <div style={{ paddingBottom: "10px" }}>Check your inputs!</div>
          {messages.map((item, index) => {
            return <div key={index}>{index + 1 + ". " + item.message}</div>;
          })}
        </>,
        {
          autoClose: 10000,
          toastId: "formDataError",
        }
      );
      handleClose();
      return;
    }
    // Create elab ftw description list and store it to the description list state
    let convSch = { ...convertedSchema };
    // use this if we want to show all fields in description list
    let convProp = JSON.parse(JSON.stringify(convSch["properties"]));
    fillValueWithEmptyString(convProp);
    let cleaned = prepareDataForDescList(convProp); // skip keyword that has value of array with objects as its elements
    //let cleaned = removeEmpty(prepareDataForDescList(convSch["properties"]));
    if (cleaned === undefined || Object.keys(cleaned).length === 0) {
      toast.error(
        <>
          <div>
            <strong>
              Unable to download. Form data is not valid. Maybe empty?
            </strong>
          </div>
          <div style={{ paddingBottom: "10px" }}>Check your inputs!</div>
        </>,
        {
          autoClose: 10000,
          toastId: "formDataError",
        }
      );
      handleClose();
      return;
    }
    // create description list
    let footnote = `<div> This template was generated with <span><a title=https://github.com/csihda/adamant href=https://github.com/csihda/adamant>${AdamantVersion["adamant_version"]}</a></span> </div>`;
    let descList = `<div><span><a title=https://github.com/csihda/adamant href=${eLabURL}$/browse-experiment>Edit experiment on Adamant</a></span> </div>`;
    descList += createDescriptionListFromJSON(
      cleaned,
      convSch,
      convProp,
      schema,
      footnote,
      true
    ); // false means without styling

    setDescriptionList(descList);

    let sha256_hash = CryptoJS.SHA256(descList);
    let a = document.createElement("a");
    let file = new Blob([descList], {
      type: "text/html",
    });
    a.href = URL.createObjectURL(file);
    a.download = `desclist-${sha256_hash}.tpl`;
    a.click();

    handleClose();
  };

  // "Create eLabFTW Experiment" defaults to whichever eLabFTW instance is currently
  // connected (internal or external - only one can be connected at a time), instead of
  // always the internal one. Still freely editable inside the dialog afterward.
  const handleOpenCreateExperimentDialog = () => {
    if (loginState === "true") {
      setELabURL(GeneralConfig["local-elab-url"]);
    } else if (externalLoginState === "true") {
      setELabURL(externalElabUrl);
      setToken(externalToken);
    }
    setOpenCreateElabFTWExperimentDialog(true);
  };

  // get available tags from elabftw
  const getTagsELabFTW = () => {
    $.ajax({
      type: "POST",
      url: "/api/get_tags",
      dataType: "json",
      data: {
        eLabURL: eLabURL,
        eLabToken: token,
      },
      success: function (status) {
        console.log("Tags retrieved successfully");
        //let arr = [];
        //for (let i = 0; i < status.length; i++) {
        //  arr.push(status[i]["tag"]);
        //}
        setRetrievedTags(status);
        toast.success(`Successfully retrieved the tags!`, {
          toastId: "fetchingTagsSuccess",
        });
      },
      error: function (status) {
        console.log("Failed to retrieve tags");
        console.log(status);
        toast.error(`Failed to get the tags!\nMaybe wrong url or token?`, {
          toastId: "fetchingTagsError",
        });
      },
    });
  };

  // create an experiment in elabftw based on the schema and data
  const createExperimentELabFTW = () => {
    // validate the data first using ajv
    //let content = { ...jsonData };
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );

    let contentSchema = { ...schema };

    // get rid of empty values in content
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }
    console.log("content", content);
    //console.log("loadedFiles", loadedFiles)

    /*
    // get the paths where the uploaded files are from content
    let fileEntries = []
    for (let i=0; i<loadedFiles.length; i++) {
      let file = loadedFiles[i]
      let fileName = file["name"]
      let fileType = file["type"]
      let fileSize = file["size"]
      //console.log(file["name"])
      fileEntries.push(`fileupload:${fileType};${fileName};${fileSize}`)
    }
    //console.log(fileEntries)
    let paths = []
    for (let i=0; i<fileEntries.length; i++) {
      let path = getPaths(content, fileEntries[i])
      paths.push(path)
    }
    console.log(paths)

    // read files from loadedFiles then insert it to the content
    */

    //
    // validate jsonData against its schema before submission
    //
    const [valid, messages] = validateAgainstSchema(
      content,
      JSON.parse(JSON.stringify(contentSchema))
    );
    setErrorStuffUponValidation(messages);
    if (!valid || (Object.keys(content).length === 0)) {
      toast.error(
        <>
          <div>
            <strong>Form data is not valid.</strong>
          </div>
          <div style={{ paddingBottom: "10px" }}>Check your inputs!</div>
          {messages.map((item, index) => {
            return <div key={index}>{index + 1 + ". " + item.message}</div>;
          })}
        </>,
        {
          autoClose: 10000,
          toastId: "formDataError",
        }
      );
      // clear states
      //setToken("");
      setExperimentTitle("");
      setTags([]);
      return;
    }
    // call create experiment api
    console.log("tags:", tags);
    $.ajax({
      type: "POST",
      url: "/api/create_experiment",
      async: false,
      dataType: "json",
      data: {
        javascript_data: JSON.stringify(content),
        schema: JSON.stringify(contentSchema),
        eLabURL: eLabURL,
        eLabToken: token,
        title: experimentTitle,
        body: descriptionList,
        tags: JSON.stringify(tags),
      },
      success: function (status) {
        console.log("SUCCESS");
        console.log(status);

        // close submit dialog
        setOpenCreateElabFTWExperimentDialog(false);
        toast.success(
          `Successfully created an experiment with id: ${status["experimentId"]}!`,
          {
            toastId: "createExperimentSuccess",
          }
        );

        // clear states
        // setToken("");
        setExperimentTitle("");
        setRetrievedTags([]);
        setTags([]);
      },
      error: function (status) {
        console.log("ERROR");
        console.log(status);

        // close submit dialog
        setOpenCreateElabFTWExperimentDialog(false);
        toast.error(
          `Failed to create an experiment!\nMaybe wrong url or token?`,
          {
            toastId: "createExperimentError",
          }
        );
        // clear states
        //setToken("");
        setExperimentTitle("");
        setRetrievedTags([]);
        setTags([]);
      },
    });
  };

  // submit sem job request
  const submitJobRequest = () => {
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );

    let contentSchema = { ...schema };

    // get rid of empty values in content
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }

    $.ajax({
      type: "POST",
      url: "/api/submit_job_request",
      async: false,
      dataType: "json",
      data: {
        javascript_data: JSON.stringify(content),
        schema: JSON.stringify(contentSchema),
        body: descriptionList,
      },
      success: function (status) {
        if (status["response"] === 200) {
          console.log("SUCCESS");
          console.log(status);

          // close submit dialog
          setOpenJobRequestDialog(false);
          toast.success(`${status.responseText}`, {
            toastId: "jobRequestSubmitSuccess",
          });
        } else {
          console.log("ERROR");
          console.log(status);

          // close submit dialog
          setOpenJobRequestDialog(false);
          toast.error(`${status.responseText}`, {
            toastId: "jobRequestSubmitError",
          });
        }
      },
      error: function (status) {
        console.log("ERROR");
        console.log(status);

        // close submit dialog
        setOpenJobRequestDialog(false);
        toast.error(`${status.responseText}`, {
          toastId: "jobRequestSubmitError",
        });
      },
    });
  };

  // submit dataset to INPTDAT
  const submitDataset = () => {
    // TO DO
    alert("to do");
  };

  // download bundled dataset as .zip
  const handleCreateBundle = () => {
    //let content = { ...jsonData };
    let convSchemaData = { ...convertedSchema };

    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    let contentSchema = { ...schema };

    // get rid of empty values in content
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }

    // Zipping process
    const zip = new JSZip();
    // Zip the metadata
    zip.file("metadata.json", JSON.stringify(content));
    zip.file("schema.json", JSON.stringify(contentSchema));

    const fileDir = zip.folder("resources");
    //img.file("smile.gif", AdamantLogo, { base64: true });

    // read loaded files
    if (loadedFiles.length > 0) {
      setOpenFilesDialog(true);
      setFilesDialogContent([
        "Zipping the files...",
        "The files are being zipped / bundled. Please wait.",
        "",
      ]);
      for (let i = 0; i < loadedFiles.length; i++) {
        fileDir.file(loadedFiles[i]["name"], loadedFiles[i], { binary: true });
      }
    }

    zip.generateAsync({ type: "blob" }).then(function (content) {
      // see FileSaver.js
      setOpenFilesDialog(false);
      setFilesDialogContent(["", "", ""]);
      saveAs(content, "dataset.zip");
    });
  };

  // --------------------------------------- Dataset certification feature ------------------------------------
  const readAndHash = (file) => {
    return new Promise((resolve) => {
      let reader = new FileReader();
      // hash the file
      reader.onloadend = function () {
        let file_result = this.result;
        let file_wordArr = CryptoJS.lib.WordArray.create(file_result);
        let sha256_hash = CryptoJS.SHA256(file_wordArr);
        // console.log(`finished hashing "${file["name"]}"`);
        resolve([file["name"], sha256_hash.toString()]);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const certifyOnBloxberg = (hashes, metadata) => {
    let crid = [];
    let file_names = [];

    for (const [key, value] of Object.entries(hashes)) {
      file_names.push(key);
      crid.push(value);
    }

    // console.log("crid:", crid);
    // console.log("file names:", file_names);

    return $.ajax({
      type: "POST",
      url: "/api/certify",
      async: true,
      dataType: "json",
      data: {
        crid: JSON.stringify(crid),
        metadata: JSON.stringify(metadata),
        file_names: JSON.stringify(file_names),
        hashes_dict: JSON.stringify(hashes),
      },
      success: function (status) {
        //console.log(status);
        console.log("Certification succeeded");
      },
      error: function (status) {
        console.log("Certification failed");
      },
    });
  };

  async function handleOnlyCertify() {
    // Prepare metadata
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    //// get rid of empty values in content
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }

    // Prepare schema
    let contentSchema = { ...schema };

    setOpenProgressDialog(true);
    setProgressDialogTitle("Processing...");
    setProgressDialogMessages("Starting...");
    setProgress(0);
    let hashDict = {};
    const increment = 100 / (loadedFiles.length + 1 + 1 + 1 + 1); // num of files plus one certification process plus one zipping process
                                                                 // plus one metadata plus one schema
    // find the index of resource key
    let resourceKeyIndex = 0;
    for (let i = 0; i < convSchemaData["properties"].length; i++) {
      if (convSchemaData["properties"][i]["fieldKey"] === "resource") {
        resourceKeyIndex = i;
      }
    }

    // hashing: to do: change the order of the hashing, hash the files first and add the hash into the json data, then hash the json data
    for (let i = 0; i < loadedFiles.length + 2; i++) {
      if (i < loadedFiles.length) {
        setProgressDialogMessages(`Hashing "${loadedFiles[i]["name"]}"...`);
        const result = await readAndHash(loadedFiles[i]);
        setProgress((i + 1) * increment);
        hashDict[result[0]] = result[1];
        content["resource"]["hash"] = result[1];
        content["resource"]["hashAlgorithm"] = "SHA-256";
        convSchemaData["properties"][resourceKeyIndex]["value"][i]["hash"] = result[1];
        convSchemaData["properties"][resourceKeyIndex]["value"][i]["hashAlgorithm"] = "SHA-256";
      } else if (i === loadedFiles.length) {
        setProgressDialogMessages(`Hashing "metadata.json"...`);
        let content_hash = CryptoJS.SHA256(JSON.stringify(content));
        setProgress((i + 1) * increment);
        hashDict["metadata.json"] = content_hash.toString();
      } else if (i === loadedFiles.length + 1) {
        setProgressDialogMessages(`Hashing "schema.json"...`);
        let content_hash = CryptoJS.SHA256(JSON.stringify(contentSchema));
        setProgress((i + 1) * increment);
        hashDict["schema.json"] = content_hash.toString();
      }
    }
    setProgressDialogMessages(`Finished hashing all files.`);
    //console.log("finished:", hashDict);
    setHashes(hashDict);
    // certifying
    setProgressDialogMessages(`Certifying all files...`);
    const result = await certifyOnBloxberg(hashDict, {});
    //console.log("result:", result);
    setProgress((loadedFiles.length + 3) * increment);

    // zip the results together
    if (result["status_code"] === 200) {
      setProgressDialogMessages(`Zipping certificates...`);
      const zip = new JSZip();
      for (const [file_name, content] of Object.entries(result["data"])) {
        zip.file(file_name, content, { base64: true });
      }

      zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, "certificates.zip");
      });
      setProgress(100);
      setProgressDialogTitle("Process complete");
      setProgressDialogMessages(`Finished everything.`);
      setOpenProgressDialog(false);
      //setConvertedSchema(convSchemaData);
      updateParent(convSchemaData);
    } else {
      setProgress(0);
      setProgressDialogTitle("ERROR");
      setProgressDialogMessages(`ERROR`);
    }
  }
  // -------------------------------------------------------------------------------------------------------

  const handleOnClickProceedButton = () => {
    // Create elab ftw description list and store it to the description list state
    let convSch = { ...convertedSchema };
    // use this if we want to show all fields in description list
    let convProp = JSON.parse(JSON.stringify(convSch["properties"]));
    fillValueWithEmptyString(convProp);
    let cleaned = prepareDataForDescList(convProp);
    //let cleaned = removeEmpty(prepareDataForDescList(convSch["properties"]));
    if (cleaned === undefined || Object.keys(cleaned).length === 0) {
      toast.error(
        <>
          <div>
            <strong>
              Unable to proceed. Form data is not valid. Maybe empty?
            </strong>
          </div>
          <div style={{ paddingBottom: "10px" }}>Check your inputs!</div>
        </>,
        {
          toastId: "formDataError",
        }
      );
      return;
    }
    // create description list
    let footnote = `<div> This template was generated with <span><a title=https://github.com/csihda/adamant href=https://github.com/csihda/adamant>${AdamantVersion["adamant_version"]}</a></span> </div>`;
    let descList = `<div><span><a title=https://github.com/csihda/adamant href=${eLabURL}$/browse-experiment>Edit experiment on Adamant</a></span> </div>`;
    descList += createDescriptionListFromJSON(
      cleaned,
      convSch,
      convProp,
      schema,
      footnote,
      true
    ); // false means without styling

    setDescriptionList(descList);

    // validate the data first using ajv
    //let content = { ...jsonData };
    let convSchemaData = { ...convertedSchema };
    let content = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    // get rid of empty values in content
    content = removeEmpty(content);
    if (content === undefined) {
      content = {};
    }
    //console.log("content", content);
    let contentSchema = { ...schema };

    //console.log("content", content);

    //
    // validate jsonData against its schema before submission
    //
    const [valid, messages] = validateAgainstSchema(content, contentSchema);
    setErrorStuffUponValidation(messages);
    //console.log(content);
    if (!valid || (Object.keys(content).length === 0)) {
      toast.error(
        <>
          <div>
            <strong>Form data is not valid.</strong>
          </div>
          <div style={{ paddingBottom: "10px" }}>Check your inputs!</div>
          {messages.map((item, index) => {
            return <div key={index}>{index + 1 + ". " + item.message}</div>;
          })}
        </>,
        {
          autoClose: 10000,
          toastId: "formDataError",
        }
      );
      // clear states
      //setToken("");
      setExperimentTitle("");
      setTags([]);
      return;
    } else {
      //setOpenSubmitDialog(true);
      setOpenFormReviewDialog(true);
    }
  };

  // gather all loaded files in one object
  const handleLoadedFiles = (file, value) => {
    let files = loadedFiles;
    //console.log(files);

    // check if file already exists
    let isFileAlreadyExist = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i] !== undefined) {
        if (files[i]["name"] === file["name"]) {
          isFileAlreadyExist = true;
        }
      }
    }

    // check if file metadata already exists in value
    let isFileMetadataAlreadyExist = false;
    let whichIndex = 0;
    if (value !== undefined) {
      if (value.length !== 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === "object") {
            if (Object.values(value[i]).includes(file["name"])) {
              isFileMetadataAlreadyExist = true;
              whichIndex = i;
            }
          }
        }
      }
    }

    if (isFileAlreadyExist) {
      console.log("File already exists. Skipping it.");
      toast.warning(
        <>
          <div>
            <strong>File already loaded: {`${file["name"]}`}.</strong>
          </div>
        </>,
        {
          toastId: "fileAlreadyLoaded" + file["name"],
        }
      );
      //console.log("loaded files:", files);
      return true;
    } else if (!isFileAlreadyExist && isFileMetadataAlreadyExist) {
      console.log(
        "File not exist yet but the metadata exists. Replace the undefined element in loadedFiles with this current file."
      );
      files[whichIndex] = file;
      setLoadedFiles(files);
      console.log("loaded files:", files);
    } else {
      console.log("File not exist yet. Pushing it.");
      files.push(file);
      //console.log("loaded files:", files);
      setLoadedFiles(files);
      console.log("File added. Current files:", loadedFiles);
      toast.success(
        <>
          <div>
            <strong>File successfully loaded:</strong>
            {` ${file["name"]}`}.
          </div>
        </>,
        {
          toastId: "fileLoadedSuccessfully" + file["name"],
        }
      );
      return false;
    }
  };

  // remove file from loadedFiles based on its index
  const handleRemoveFile = (fileIndex) => {
    let files = loadedFiles;
    if (fileIndex > -1) {
      files.splice(fileIndex, 1);
      setLoadedFiles(files);
      console.log("File removed. Current files:", loadedFiles);
    } else {
      console.log("No file needs to be removed. Current files:", loadedFiles);
    }
  };

  // service groups that stay collapsed behind a hover reveal, instead of always-expanded like Default
  const COLLAPSIBLE_GROUPS = ["Default", "NextCloud", "eLabFTW"];

  // groups tied to a connection: whether their header should read as "active" rather than
  // just a muted section label (Default/Browse have no connection concept, so always active)
  const isSchemaGroupConnected = (group) => {
    if (group === "NextCloud") return ncLoginState === "true";
    if (group === "eLabFTW") return loginState === "true" || externalLoginState === "true";
    return true;
  };

  // combined, searchable list of schema options across Default/NextCloud/eLabFTW plus their browse actions
  const schemaOptions = useMemo(() => {
    const localOpts = schemaNameList.filter((name) => name !== "").map((name) => ({
      id: `local:${name}`, group: "Default", label: name, source: "local", value: name,
    }));
    const ncOpts = ncSchemaEntries.map((entry) => ({
      id: `nc:${entry.name}`, group: "NextCloud", label: entry.name, source: "nextcloud",
      value: `${GeneralConfig["nextcloud-schemas-folder-path"]}/${entry.name}`,
    }));
    const ncBrowseAction = {
      id: "action:nextcloud", group: "NextCloud", label: "Browse NextCloud...", source: "action-nextcloud",
      disabled: ncLoginState !== "true", isAction: true,
    };
    // only one of internal/external eLabFTW is ever connected at a time (see
    // handleLogin/handleExternalLogin), so there is only ever one "eLabFTW" group to show.
    // Quick-search entries only exist for the internal instance - external has no
    // pre-configured schema path to quick-search (it differs per instance/user), so it only
    // ever gets a browse action.
    const elabOpts = loginState === "true" ? elabSchemaEntries.map((entry) => ({
      id: `elab:${entry.name}`, group: "eLabFTW", label: entry.name, source: "elab", value: entry,
    })) : [];
    const elabBrowseAction = {
      id: "action:elab", group: "eLabFTW", label: "Browse eLabFTW...", source: "action-elab",
      disabled: loginState !== "true" && externalLoginState !== "true", isAction: true,
    };
    const localBrowseAction = {
      id: "action:local", group: "Browse", label: "Browse local file...", source: "action-local", isAction: true,
    };
    const loadFromUrlAction = {
      id: "action:url", group: "Browse", label: "Load schema from URL...", source: "action-url", isAction: true,
    };
    return [...localOpts, ...ncOpts, ncBrowseAction, ...elabOpts, elabBrowseAction, localBrowseAction, loadFromUrlAction];
  }, [schemaNameList, ncSchemaEntries, elabSchemaEntries, ncLoginState, loginState, externalLoginState]);

  // lazy-load NextCloud/eLabFTW schema lists the first time the combobox is opened
  const handleSchemaComboboxOpen = () => {
    if (ncLoginState === "true" && ncSchemaEntries.length === 0 && !ncSchemaListLoading) {
      loadNextCloudSchemaList();
    }
    if (loginState === "true" && elabSchemaEntries.length === 0 && !elabSchemaListLoading) {
      loadELabSchemaList();
    }
  };

  const handleSchemaOptionSelected = (event, option) => {
    if (!option) {
      setSelectedSchemaOption(null);
      setSchemaSearchText("");
      clearSchemaOnClick();
      return;
    }
    if (option.source === "action-local") {
      openLocalFilePicker();
      return;
    }
    if (option.source === "action-url") {
      setOpenLoadSchemaFromUrlDialog(true);
      return;
    }
    if (option.source === "action-nextcloud") {
      setNextCloudBrowseMode("pick-file");
      setOpenNextCloudBrowseDialog(true);
      return;
    }
    if (option.source === "action-elab") {
      // only one of internal/external eLabFTW is ever connected at a time - route to
      // whichever one it is
      if (loginState === "true") {
        setOpenElabBrowseDialog(true);
      } else {
        setOpenExternalElabBrowseDialog(true);
      }
      return;
    }
    setSelectedSchemaOption(option);
    setSchemaSearchText(option.label);
    if (option.source === "local") {
      handleSelectSchemaOnChange(option.value);
    } else if (option.source === "nextcloud") {
      handleNextCloudSchemaSelected(option.value);
    } else if (option.source === "elab") {
      handleELabSchemaSelected(option.value, elabSchemaItemId);
    }
  };

  // groups render as a submenu flyout (a separate floating box), not an inline expansion,
  // anchored to whichever group header the mouse (or keyboard highlight) is currently on
  const schemaGroupAnchorRefs = useRef({});
  const schemaGroupCloseTimerRef = useRef(null);

  const openSchemaGroupFlyout = (group) => {
    if (schemaGroupCloseTimerRef.current) {
      clearTimeout(schemaGroupCloseTimerRef.current);
      schemaGroupCloseTimerRef.current = null;
    }
    setHoveredSchemaGroup(group);
  };

  const scheduleCloseSchemaGroupFlyout = () => {
    schemaGroupCloseTimerRef.current = setTimeout(() => setHoveredSchemaGroup(null), 150);
  };

  const hoveredSchemaGroupOptions = useMemo(() => {
    if (!hoveredSchemaGroup) return [];
    return filterSchemaOptions(schemaOptions, {
      inputValue: schemaSearchText,
      getOptionLabel: (option) => option.label,
    }).filter((option) => option.group === hoveredSchemaGroup);
  }, [hoveredSchemaGroup, schemaOptions, schemaSearchText]);

  const handleSchemaFlyoutOptionClick = (option) => {
    handleSchemaOptionSelected(null, option);
    setHoveredSchemaGroup(null);
    setSchemaComboboxOpen(false);
  };

  const renderSchemaGroup = (params) => {
    if (!COLLAPSIBLE_GROUPS.includes(params.group)) {
      // the "Browse" group only ever holds the single "Browse local file..." action,
      // whose own label already says everything - a group header here is redundant
      return (
        <li key={params.key}>
          <ul style={{ padding: 0 }}>{params.children}</ul>
        </li>
      );
    }
    // Default/Browse have no connection concept and stay in ListSubheader's normal muted
    // color; NextCloud/eLabFTW switch from muted (not connected) to a full-opacity, bolder
    // color once connected, so "connected" is visibly distinct from "just a section label"
    // instead of every group looking identically grayed-out
    const isServiceGroup = ["NextCloud", "eLabFTW"].includes(params.group);
    const isConnected = isSchemaGroupConnected(params.group);
    return (
      <li
        key={params.key}
        ref={(node) => { schemaGroupAnchorRefs.current[params.group] = node; }}
        onMouseEnter={() => openSchemaGroupFlyout(params.group)}
        onMouseLeave={scheduleCloseSchemaGroupFlyout}
      >
        <ListSubheader component="div">
          <span
            style={isServiceGroup && isConnected ? { color: "rgba(0, 0, 0, 0.87)", fontWeight: 600 } : undefined}
          >
            {params.group}
          </span>
          <span aria-hidden="true" style={{ marginLeft: "4px", color: "#999" }}>▸</span>
        </ListSubheader>
      </li>
    );
  };

  // drives the bottom-right loading badge: any NextCloud/eLabFTW list fetch (hovering a
  // group in the schema dropdown), a schema fetch+render, or a NextCloud dataset upload
  const isGloballyLoading = ncSchemaListLoading || elabSchemaListLoading || asyncOperationLoading;

  return (
    <>
      <FormContext.Provider
        value={{
          loadedFiles,
          setLoadedFiles,
          handleRemoveFile,
          handleLoadedFiles,
          updateParent,
          convertedSchema,
          updateFormDataId,
          handleDataDelete,
          handleConvertedDataInput,
          SEMSelectedDevice,
          schemaSpecification,
          setSchemaSpecification,
          setSEMSelectedDevice,
          implementedFieldTypes,
          handleCheckIDexistence,
          openDatasetSubmissionDialog,
        }}
      >
        <div style={{ paddingBottom: "5px" }}>
          <div
            style={{
              display: "flex",
              width: "100%",
            }}
          >
            <img
              style={{
                paddingLeft: "10px",
                height: "100px",
                borderRadius: "5px",
              }}
              alt="header"
              src={HeaderImage !== undefined ? HeaderImage : QPTDATLogo}
            />
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                paddingRight: "10px",
                justifyContent: "right",
                verticalAlign: "top",
              }}
            >
              <Button
                onClick={() => {
                  window.location.reload();
                }}
              >
                Home
              </Button>
              <div style={{ borderRight: "1px solid #D3D3D3" }}></div>
              {(loginState === "true" || externalLoginState === "true" || ncLoginState === "true") && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                  }}
                >
                  {(loginState === "true" || externalLoginState === "true") && (
                    <Chip
                      style={{ marginRight: "8px", color: "#2e7d32", borderColor: "#2e7d32" }}
                      variant="outlined"
                      label={`eLabFTW: ${loginState === "true" ? firstName : externalFirstName}`}
                      onDelete={() => (loginState === "true" ? handleLogOut() : handleExternalLogOut())}
                      deleteIcon={<CancelIcon titleAccess="Click to logout" />}
                    />
                  )}
                  {ncLoginState === "true" && (
                    <Chip
                      style={{ marginRight: "8px", color: "#2e7d32", borderColor: "#2e7d32" }}
                      variant="outlined"
                      label={`NextCloud: ${ncDisplayName}`}
                      onDelete={() => handleNextCloudLogOut()}
                      deleteIcon={<CancelIcon titleAccess="Click to logout" />}
                    />
                  )}
                </div>
              )}
              <div style={{ borderRight: "1px solid #D3D3D3" }}></div>
              <Button
                color="primary"
                onClick={(event) => setConnectMenuAnchorEl(event.currentTarget)}
              >
                CONNECT
              </Button>
              <Menu
                anchorEl={connectMenuAnchorEl}
                open={Boolean(connectMenuAnchorEl)}
                onClose={() => setConnectMenuAnchorEl(null)}
              >
                <MenuItem
                  disabled={ncLoginState === "true"}
                  onClick={() => {
                    setConnectMenuAnchorEl(null);
                    setOpenNextCloudLoginDialog(true);
                  }}
                >
                  NextCloud
                </MenuItem>
                <MenuItem
                  disabled={loginState === "true" || externalLoginState === "true"}
                  onClick={() => {
                    setConnectMenuAnchorEl(null);
                    setOpenELabFTWLoginDialog(true);
                  }}
                >
                  eLabFTW
                </MenuItem>
              </Menu>
            </div>
          </div>
          {!inputMode ? (
            <div
              style={{
                display: "flex",
                textAlign: "left",
                padding: "10px 10px 0px 10px",
              }}
            >
              <Autocomplete
                id="select-available-schema"
                style={{ width: "100%" }}
                options={schemaOptions}
                value={selectedSchemaOption}
                open={schemaComboboxOpen}
                inputValue={schemaSearchText}
                groupBy={(option) => option.group}
                getOptionLabel={(option) => option.label || ""}
                getOptionDisabled={(option) => Boolean(option.disabled)}
                getOptionSelected={(option, value) => option.id === value.id}
                filterOptions={filterSchemaOptions}
                onOpen={() => {
                  setSchemaComboboxOpen(true);
                  // clear any leftover search text (e.g. the previously selected schema's
                  // name) so every schema is visible again instead of just that one match
                  setSchemaSearchText("");
                  handleSchemaComboboxOpen();
                }}
                onClose={(event, reason) => {
                  if (schemaGroupCloseTimerRef.current) {
                    clearTimeout(schemaGroupCloseTimerRef.current);
                  }
                  setSchemaComboboxOpen(false);
                  setHoveredSchemaGroup(null);
                  // closing without picking a new schema (escape/blur/toggle) - restore the
                  // box to show the currently selected schema's name, same as before opening.
                  // A fresh pick ("select-option") already set the right text itself.
                  if (reason !== "select-option") {
                    setSchemaSearchText(selectedSchemaOption ? selectedSchemaOption.label : "");
                  }
                }}
                onInputChange={(event, newValue) => setSchemaSearchText(newValue)}
                onChange={handleSchemaOptionSelected}
                onHighlightChange={(event, option) => {
                  if (option && COLLAPSIBLE_GROUPS.includes(option.group)) {
                    openSchemaGroupFlyout(option.group);
                  }
                }}
                renderGroup={renderSchemaGroup}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Select existing schema"
                    autoComplete="off"
                  />
                )}
              />
              <Popper
                open={Boolean(hoveredSchemaGroup) && hoveredSchemaGroupOptions.length > 0}
                anchorEl={hoveredSchemaGroup ? schemaGroupAnchorRefs.current[hoveredSchemaGroup] : null}
                placement="right-start"
                style={{ zIndex: 1500 }}
              >
                <Paper
                  onMouseEnter={() => openSchemaGroupFlyout(hoveredSchemaGroup)}
                  onMouseLeave={scheduleCloseSchemaGroupFlyout}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <MenuList>
                    {hoveredSchemaGroupOptions.map((option) => (
                      <MenuItem
                        key={option.id}
                        disabled={Boolean(option.disabled)}
                        onClick={() => handleSchemaFlyoutOptionClick(option)}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Paper>
              </Popper>
              <input {...getInputProps()} style={{ display: "none" }} />
              <div
                style={{
                  paddingLeft: "10px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                OR
              </div>
              <Button
                onClick={() => createSchemaFromScratch()}
                style={{
                  width: "100%",
                  marginLeft: "10px",
                  marginRight: "10px",
                }}
                variant="contained"
                color="primary"
              >
                CREATE FROM SCRATCH
              </Button>
              <div
                style={{
                  paddingLeft: "10px",
                  width: "100%",
                  display: "flex",
                  justifyContent: "right",
                  alignItems: "center",
                }}
              >
                {/* <Tooltip
                  placement="top"
                  title="Wondering how to use this tool?"
                >
                  <Button
                    onClick={() => {
                      window.open(
                        "https://github.com/csihda/adamant",
                        "_blank" // <- This is what makes it open in a new window.
                      );
                    }}
                  >
                    <HelpIcon />
                  </Button>
                  </Tooltip>*/}
              </div>
            </div>
          ) : null}
        </div>
        {!inputMode ? (
          <div
            style={{
              paddingLeft: "10px",
              display: "flex",
              width: "100%",
              textAlign: "left",
            }}
          >
            {schemaValidity === true ? null : (
              <>
                <div
                  style={{
                    paddingRight: "10px",
                    paddingTop: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "red",
                  }}
                >
                  {schemaMessage}
                </div>
              </>
            )}
            {createScratchMode === true ? (
              <>
                <div
                  style={{
                    paddingRight: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "green",
                  }}
                >
                  Create from scratch mode. You can now start editing.
                </div>
                <Button
                  onClick={() => clearSchemaOnClick()}
                  variant="outlined"
                  color="secondary"
                >
                  Clear
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
        <div style={{ padding: "10px" }}>
          <Divider />
        </div>
        {renderReady === true ? (
          <FormRenderer
            revertAllChanges={revertAllChanges}
            schema={convertedSchema}
            setSchemaSpecification={setSchemaSpecification}
            originalSchema={schema}
            edit={editMode}
            setEditMode={setEditMode}
            ncUrl={ncUrl}
            ncUsername={ncUsername}
            ncAppPassword={ncAppPassword}
            ncLoginState={ncLoginState}
            eLabURL={eLabURL}
            token={token}
            loginState={loginState}
            externalElabUrl={externalElabUrl}
            externalToken={externalToken}
            externalLoginState={externalLoginState}
          />
        ) : null}
        <div style={{ padding: "10px" }}>
          <Divider />
        </div>
        <div
          style={{
            padding: "10px 10px",
            display: "flex",
            justifyContent: "right",
          }}
        >
          <div style={{ width: "100%", display: "inline-block" }}>
            <Button
              onClick={() => handleOnClickProceedButton()}
              style={{ float: "right" }}
              variant="contained"
              color="primary"
              disabled={!renderReady}
            >
              Proceed
            </Button>
            <Button
              style={{ float: "right", marginRight: "5px" }}
              id="demo-positioned-button"
              aria-controls={open ? "demo-positioned-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleClick}
              disabled={!renderReady}
            >
              <DownloadIcon /> Download Schema/Data
            </Button>
            <Menu
              id="demo-positioned-menu"
              aria-labelledby="demo-positioned-button"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            >
              <MenuItem onClick={handleDownloadJsonSchema}>
                Download JSON Schema
              </MenuItem>
              <MenuItem onClick={handleDownloadFormData}>
                Download JSON Data
              </MenuItem>
              <MenuItem onClick={handleDownloadDescriptionList}>
                Download Description List
              </MenuItem>
            </Menu>
          </div>
        </div>
        <div style={{ padding: "10px", color: "grey" }}>
          {AdamantVersion["adamant_version"]}
        </div>
      </FormContext.Provider>
      <CreateELabFTWExperimentDialog
        setTags={setTags}
        tags={tags}
        setRetrievedTags={setRetrievedTags}
        retrievedTags={retrievedTags}
        setExperimentTitle={setExperimentTitle}
        createExperimentELabFTW={createExperimentELabFTW}
        setToken={setToken}
        token={token}
        setELabURL={setELabURL}
        eLabURL={eLabURL}
        setOpenCreateElabFTWExperimentDialog={
          setOpenCreateElabFTWExperimentDialog
        }
        openCreateElabFTWExperimentDialog={openCreateElabFTWExperimentDialog}
        getTagsELabFTW={getTagsELabFTW}
      />
      <DatasetSubmissionDialog
        setOpenDatasetSubmissionDialog={setOpenDatasetSubmissionDialog}
        openDatasetSubmissionDialog={openDatasetSubmissionDialog}
        submitDataset={submitDataset}
        handleCreateBundle={handleCreateBundle}
        handleOnlyCertify={handleOnlyCertify}
      />
      {openFormReviewDialog ? (
        <FormReviewBeforeSubmit
          onlineMode={onlineMode}
          openFormReviewDialog={openFormReviewDialog}
          setOpenFormReviewDialog={setOpenFormReviewDialog}
          descriptionList={descriptionList}
          setOpenFunctions={{
            setOpenCreateElabFTWExperimentDialog: handleOpenCreateExperimentDialog,
            setOpenJobRequestDialog,
            setOpenDatasetSubmissionDialog,
          }}
          submitFunctions={{ submitJobRequest }}
          submitText={submitText}
          endPoint={window.location.href}
          loadedFiles={loadedFiles}
          ncConnected={ncLoginState === "true"}
          onSubmitDatasetToNextCloud={() => {
            setNextCloudBrowseMode("pick-folder");
            setOpenNextCloudBrowseDialog(true);
          }}
        />
      ) : null}
      {GeneralConfig["usecase-dialog"] ? <ChooseUseCasesDialog
        openUseCasesDialog={openUseCasesDialog}
        setOpenUseCasesDialog={setOpenUseCasesDialog}
        firstName={firstName}
        loginState={loginState}
        setOpenLDAPLoginDialog={setOpenELabFTWLoginDialog}
        handleLogOut={handleLogOut}
      /> : null}
      <ELabFTWLoginDialog
        open={openELabFTWLoginDialog}
        setOpen={setOpenELabFTWLoginDialog}
        token={token}
        setToken={setToken}
        email={email}
        setEmail={setEmail}
        remember={rememberElab}
        setRemember={setRememberElab}
        handleLogin={handleLogin}
        externalElabUrl={externalElabUrl}
        setExternalElabUrl={setExternalElabUrl}
        externalToken={externalToken}
        setExternalToken={setExternalToken}
        externalEmail={externalEmail}
        setExternalEmail={setExternalEmail}
        externalRemember={rememberExternalElab}
        setExternalRemember={setRememberExternalElab}
        handleExternalLogin={handleExternalLogin}
      />
      <NextCloudLoginDialog
        openNextCloudLoginDialog={openNextCloudLoginDialog}
        setOpenNextCloudLoginDialog={setOpenNextCloudLoginDialog}
        ncUsername={ncUsername}
        setNcUsername={setNcUsername}
        ncAppPassword={ncAppPassword}
        setNcAppPassword={setNcAppPassword}
        remember={rememberNc}
        setRemember={setRememberNc}
        handleNextCloudLogin={handleNextCloudLogin}
      />
      <NextCloudBrowseDialog
        open={openNextCloudBrowseDialog}
        setOpen={setOpenNextCloudBrowseDialog}
        ncUrl={ncUrl}
        ncUsername={ncUsername}
        ncAppPassword={ncAppPassword}
        mode={nextCloudBrowseMode}
        onSelectFile={handleNextCloudSchemaSelected}
        onSelectFolder={handleNextCloudFolderSelected}
      />
      <NextCloudUploadFilenameDialog
        open={openNcUploadFilenameDialog}
        setOpen={setOpenNcUploadFilenameDialog}
        filename={ncUploadFilename}
        setFilename={handleNcUploadFilenameChange}
        schemaFilename={ncUploadSchemaFilename}
        setSchemaFilename={handleNcUploadSchemaFilenameChange}
        onConfirm={handleSubmitDatasetToNextCloud}
      />
      <ELabFTWBrowseDialog
        open={openElabBrowseDialog}
        setOpen={setOpenElabBrowseDialog}
        eLabURL={eLabURL}
        token={token}
        onSelectFile={(entry) => handleELabSchemaSelected(entry, entry.itemId)}
      />
      <ELabFTWBrowseDialog
        open={openExternalElabBrowseDialog}
        setOpen={setOpenExternalElabBrowseDialog}
        eLabURL={externalElabUrl}
        token={externalToken}
        title="Browse Schema (eLabFTW - External)"
        onSelectFile={(entry) => handleExternalELabSchemaSelected(entry, entry.itemId)}
      />
      <LoadSchemaFromUrlDialog
        open={openLoadSchemaFromUrlDialog}
        setOpen={setOpenLoadSchemaFromUrlDialog}
        url={schemaUrlInput}
        setUrl={setSchemaUrlInput}
        onSubmit={handleLoadSchemaFromUrl}
      />
      <FilesDialog
        openFilesDialog={openFilesDialog}
        setOpenFilesDialog={setFilesDialogContent}
        content={filesDialogContent}
      />
      <ProgressDialog
        openProgressDialog={openProgressDialog}
        setOpenProgressDialog={setOpenProgressDialog}
        title={progressDialogTitle}
        progress={progress}
        messages={progressDialogMessages}
      />
      <GlobalLoadingIndicator loading={isGloballyLoading} />
    </>
  );
};

export default AdamantMain;
