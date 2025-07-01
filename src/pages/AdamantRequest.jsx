import React, { useCallback, useState } from "react";
//import { makeStyles } from "@material-ui/core/styles";
import { useDropzone } from "react-dropzone";
//import QPTDATLogo from "../assets/header-image.png";
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
import deleteKeySchema from "../components/utils/deleteKeySchema";
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
import GeneralConfig from "../general-conf.json"

// to create a bundle (download dataset+metadata as .zip)
import JSZip from "jszip";
import { saveAs } from "file-saver";
import FilesDialog from "../components/FilesDialog"

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
const removeEmpty = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === "object") {
      const childObject = removeEmpty(obj[key]);
      if (childObject === undefined) {
        delete obj[key];
      }
    } else if (obj[key] === "" || obj[key] === null || obj[key] === undefined) {
      delete obj[key];
    }
  });
  return Object.keys(obj).length > 0 || obj instanceof Array ? obj : undefined;
};

// initialize color states for request selection buttons
const createButtonColorStatesFromConfigs = (config) => {
  let buttonStates = [];
  for (let i = 0; i < config.length; i++) {
    let states = {
      variant: "contained",
      color: "primary",
    };
    buttonStates.push(states);
  }
  return buttonStates;
};

// initialize color states for schema selection buttons
const createSchemaButtonColorStates = (availableSchemas) => {
  let buttonStates = [];
  for (let i = 0; i < availableSchemas.length; i++) {
    let states = {
      variant: "outlined",
      color: "default",
    };
    buttonStates.push(states);
  }
  return buttonStates;
};

const AdamantRequest = () => {
  // state management
  const [disable, setDisable] = useState(true);
  const [schemaMessage, setSchemaMessage] = useState(null);
  const [schemaValidity, setSchemaValidity] = useState(false);
  const [schema, setSchema] = useState(null);
  const [schemaIntermediate, setSchemaIntermediate] = useState(null);
  const [renderReady, setRenderReady] = useState(false);
  const [editMode, setEditMode] = useState(true);
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
  const [jobRequestConfList, setJobRequestConfList] = useState([]);
  const [submitText, setSubmitText] = useState("Submit Job Request");
  const [availableRequestSchemas, setAvailableRequestSchemas] = useState([]);
  const [availableExpSchemas, setAvailableExpSchemas] = useState([]);
  const [renderAvailableSchemas, setRenderAvailableSchemas] = useState(false);
  const [buttonColorStates, setButtonColorStates] = useState([]);
  const [schemaSelectionButtonColors, setSchemaSelectionButtonColors] =
    useState([]);
  // for dropdown buttons
  const [anchorEl, setAnchorEl] = useState(null);
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

  const [intranetUsername, setIntranetUsername] = useState();
  const [userPassword, setUserPassword] = useState();
  const [openLDAPLoginDialog, setOpenLDAPLoginDialog] = useState(false);
  const [loginState, setLoginState] = useState("false");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");

  // loaded files object
  const [loadedFiles, setLoadedFiles] = useState([]);

  // FilesDialog
  const [openFilesDialog, setOpenFilesDialog] = useState(false);
  const [filesDialogContent, setFilesDialogContent] = useState(["", "", ""]);

  //-------------------------- useEffects to save states between reloads ----------------------------
  useEffect(() => {
    setFirstName(
      window.sessionStorage.getItem("firstName") === null
        ? ""
        : window.sessionStorage.getItem("firstName")
    );
    setToken(
      window.sessionStorage.getItem("token") === null
        ? ""
        : window.sessionStorage.getItem("token")
    );
    setLoginState(
      window.sessionStorage.getItem("loginState") === null
        ? "false"
        : window.sessionStorage.getItem("loginState")
    );
    setEmail(
      window.sessionStorage.getItem("email") === null
        ? ""
        : window.sessionStorage.getItem("email")
    );
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem("firstName", firstName);
    window.sessionStorage.setItem("token", token);
    window.sessionStorage.setItem("loginState", loginState);
    window.sessionStorage.setItem("email", email);
  }, [firstName, token, loginState, email]);
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
    let $ = require("jquery");
    $.ajax({
      type: "GET",
      url: "/api/check_mode",
      success: function (status) {
        console.log("Connection to server is established. Online mode");
        setJobRequestSchemas(status["jobRequestSchemaList"]);
        setSubmitTextList(status["submitButtonText"]);
        setJobRequestConfList(status["configs"]);
        setButtonColorStates(
          createButtonColorStatesFromConfigs(status["configs"])
        );
        console.log(
          "states:",
          createButtonColorStatesFromConfigs(status["configs"])
        );
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
        ]);
        setSchemaList([
          null,
          SchemaOne,
          SchemaTwo,
          SchemaThree,
          SchemaFour,
          SchemaFive,
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
      let $ = require("jquery");
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
          ]);
          setSchemaList([
            null,
            SchemaOne,
            SchemaTwo,
            SchemaThree,
            SchemaFour,
            SchemaFive,
          ]);
        },
      });
    }
  }, [onlineMode]);

  // handle login
  const handleLogin = () => {
    var $ = require("jquery");
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
          //let arr = [];
          //for (let i = 0; i < status.length; i++) {
          //  arr.push(status[i]["tag"]);
          //}
          setRetrievedTags(status);
          toast.success(`Successfully logged in!`, {
            toastId: "loginSuccess",
          });
          setOpenLDAPLoginDialog(false);
          setLoginState("true");
          setFirstName(status["firstname"]);
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

  const handleLogOut = () => {
    setLoginState("false");
    setToken("");
    setFirstName("");
    setEmail("");

    window.sessionStorage.setItem("firstName", "");
    window.sessionStorage.setItem("token", "");
    window.sessionStorage.setItem("loginState", "false");
    window.sessionStorage.setItem("email", "");
  };

  // handle select schema on change
  const handleSelectSchemaOnChange = (event) => {
    // first reset states
    setRenderReady(false);
    setDisable(true);
    setCreateScratchMode(false);
    setJsonData({});
    //

    console.log("selected schema:", event.target.value);
    setSelectedSchemaName(event.target.value);

    let selectedSchema = schemaList[schemaNameList.indexOf(event.target.value)];

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

    // convert selectedSchema schema to iterable array properties
    let convertedSchema = JSON.parse(JSON.stringify(selectedSchema));
    try {
      convertedSchema["properties"] = object2array(
        selectedSchema["properties"]
      );

      // update states
      setSchemaValidity(true);
      setSchemaMessage(`${event.target.value} is a valid schema`);
      setSchema(selectedSchema);
      let oriSchema = JSON.parse(JSON.stringify(selectedSchema));
      setOriginalSchema(oriSchema);
      setSchemaWithValues(JSON.parse(JSON.stringify(oriSchema)));
      setConvertedSchema(convertedSchema);

      if (jobRequestSchemas.includes(convertedSchema["title"])) {
        try {
          //let SEMlogo = require("../assets/sem-header-picture.png");
          //setHeaderImage(SEMlogo["default"]);
          setHeaderImage(QPTDATLogo);
          setEditMode(true);
        } catch (error) {
          console.log(error);
          setHeaderImage(QPTDATLogo);
          setEditMode(true);
        }
      } else {
        setHeaderImage(QPTDATLogo);
        setEditMode(true);
      }

      // create form data
      let formData = createFormDataBlueprint(selectedSchema["properties"]);
      setJsonData(formData);
    } catch (error) {
      console.log(error);
      // update states
      setSchemaValidity(false);
      setSchemaMessage(`${event.target.value} is invalid`);
      setSchema(null);
    }
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

        // convert obj schema to iterable array properties
        let convertedSchema = JSON.parse(JSON.stringify(obj));
        try {
          convertedSchema["properties"] = object2array(obj["properties"]);

          // update states
          setSchemaValidity(true);
          setSchemaMessage(`${schemaFile[0]["name"]} is a valid schema`);
          setSchema(obj);
          let oriSchema = JSON.parse(JSON.stringify(obj));
          setOriginalSchema(oriSchema);
          setSchemaWithValues(JSON.parse(JSON.stringify(oriSchema)));
          setConvertedSchema(convertedSchema);

          if (jobRequestSchemas.includes(obj["title"])) {
            try {
              //let SEMlogo = require("../assets/sem-header-picture.png");
              //setHeaderImage(SEMlogo["default"]);
              setHeaderImage(QPTDATLogo);
              setEditMode(true);
            } catch (error) {
              console.log(error);
              setHeaderImage(QPTDATLogo);
              setEditMode(true);
            }
          } else {
            setHeaderImage(QPTDATLogo);
            setEditMode(true);
          }

          // create form data
          let formData = createFormDataBlueprint(obj["properties"]);
          setJsonData(formData);
        } catch (error) {
          console.log(error);
          // update states
          setSchemaValidity(false);
          setSchemaMessage(`${schemaFile[0]["name"]} is invalid`);
          setSchema(null);
        }
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
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
    convertedSchema["properties"] = object2array(obj["properties"]);

    // update states
    setCreateScratchMode(true);
    setSchema(obj);
    let oriSchema = JSON.parse(JSON.stringify(obj));
    setOriginalSchema(oriSchema);
    setSchemaWithValues(JSON.parse(JSON.stringify(oriSchema)));
    setConvertedSchema(convertedSchema);

    if (jobRequestSchemas.includes(obj["title"])) {
      try {
        //let SEMlogo = require("../assets/sem-header-picture.png");
        //setHeaderImage(SEMlogo["default"]);
        setHeaderImage(QPTDATLogo);
        setEditMode(true);
      } catch (error) {
        console.log(error);
        setHeaderImage(QPTDATLogo);
        setEditMode(true);
      }
    } else {
      setHeaderImage(QPTDATLogo);
      setEditMode(true);
    }

    setDisable(false);
    setRenderReady(true);
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
      setEditMode(false);
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
      setEditMode(true);
      setDisable(false);
    }
  };

  // update parent (re-render everything)
  const updateParent = (value) => {
    let newValue = { ...value };

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
    convertedSchema["properties"] = object2array(value["properties"]);
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
    //console.log(convSchemaData);

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
    let jData = { ...jsonData };
    let value = deleteKeySchema(jData, path);
    setJsonData(value);
    console.log("Current form data:", value);
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
      jData = deleteKeySchema(jData, pathFormData);
      setJsonData(jData);
      console.log("Current form data:", jData);
    } else {
      let newPathFormData = pathFormData.split(".");
      newPathFormData.pop();
      newPathFormData.push(newFieldId);

      let jData = { ...jsonData };
      let value = getValue(jData, pathFormData);
      set(jData, newPathFormData, value);
      jData = deleteKeySchema(jData, pathFormData);
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
    if (!valid | (Object.keys(content).length === 0)) {
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
    if (!valid | (Object.keys(content).length === 0)) {
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
      return;
    }
    // Create elab ftw description list and store it to the description list state
    let convSch = { ...convertedSchema };
    // use this if we want to show all fields in description list
    let convProp = JSON.parse(JSON.stringify(convSch["properties"]));
    fillValueWithEmptyString(convProp);
    let cleaned = prepareDataForDescList(convProp); // skip keyword that has value of array with objects as its elements
    //let cleaned = removeEmpty(prepareDataForDescList(convSch["properties"]));
    if ((cleaned === undefined) | (cleaned === {})) {
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
      return;
    }
    // create description list
    let footnote = `<div> This template was generated with <span><a title=https://github.com/csihda/adamant href=https://github.com/csihda/adamant>${AdamantVersion["adamant_version"]}</a></span> </div>`;
    let descList = createDescriptionListFromJSON(
      cleaned,
      convSch,
      convProp,
      schema,
      footnote,
      false
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

  // get available tags from elabftw
  const getTagsELabFTW = () => {
    var $ = require("jquery");
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
    //console.log("content", content);

    //
    // validate jsonData against its schema before submission
    //
    const [valid, messages] = validateAgainstSchema(
      content,
      JSON.parse(JSON.stringify(contentSchema))
    );
    setErrorStuffUponValidation(messages);
    if (!valid | (Object.keys(content).length === 0)) {
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
    var $ = require("jquery");
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
        //setToken("");
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

    var $ = require("jquery");
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

  const handleOnClickProceedButton = () => {
    // Create elab ftw description list and store it to the description list state
    let convSch = { ...convertedSchema };
    // use this if we want to show all fields in description list
    let convProp = JSON.parse(JSON.stringify(convSch["properties"]));
    fillValueWithEmptyString(convProp);
    let cleaned = prepareDataForDescList(convProp);
    //let cleaned = removeEmpty(prepareDataForDescList(convSch["properties"]));
    if ((cleaned === undefined) | (cleaned === {})) {
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
    let descList = createDescriptionListFromJSON(
      cleaned,
      convSch,
      convProp,
      schema,
      footnote,
      true
    );

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
    if (!valid | (Object.keys(content).length === 0)) {
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

  const handleJobRequestButton = (content, index) => {
    // set submit button text
    setSubmitText(content["submitButtonText"]);

    // clean loaded files
    setLoadedFiles([]);
    // reset the button color
    if (jobRequestConfList.length !== 0) {
      let btnStates = buttonColorStates;
      for (let i = 0; i < jobRequestConfList.length; i++) {
        btnStates[i]["color"] = "primary";
      }
      setButtonColorStates(btnStates);
    }

    // clear rendered schema first
    clearSchemaOnClick();
    // and continue
    let availableSchemas = [];
    for (let i = 0; i < content["requestSchemas"].length; i++) {
      availableSchemas.push({
        schema: content.requestSchemas[i],
        schemaTitle: content.requestSchemasTitle[i],
      });
    }
    if (availableSchemas.length !== 0) {
      setRenderAvailableSchemas(true);
      setAvailableRequestSchemas(availableSchemas);

      // create default button color states for schema selection buttons
      setSchemaSelectionButtonColors(
        createSchemaButtonColorStates(availableSchemas)
      );
    } else {
      setRenderAvailableSchemas(false);
      setAvailableRequestSchemas([]);
    }

    // change the button color
    if (buttonColorStates.length !== 0) {
      let btnStates = buttonColorStates;
      btnStates[index]["color"] = "secondary";
      setButtonColorStates(btnStates);
    }
  };

  const handleSelectSchema = (content, index) => {
    // reset the button color
    if (availableRequestSchemas.length !== 0) {
      let btnStates = schemaSelectionButtonColors;
      for (let i = 0; i < availableRequestSchemas.length; i++) {
        btnStates[i]["color"] = "default";
      }
      setSchemaSelectionButtonColors(btnStates);
    }

    // get the index
    let indx = schemaNameList.indexOf(content["schema"]);
    let obj = schemaList[indx];
    let convertedSchema = JSON.parse(JSON.stringify(obj));
    convertedSchema["properties"] = object2array(obj["properties"]);
    setSchema(obj);
    let oriSchema = JSON.parse(JSON.stringify(obj));
    setOriginalSchema(oriSchema);
    setSchemaWithValues(JSON.parse(JSON.stringify(oriSchema)));
    setConvertedSchema(convertedSchema);

    // render the schema
    renderOnClick();

    // change the button color
    if (schemaSelectionButtonColors.length !== 0) {
      let btnStates = schemaSelectionButtonColors;
      btnStates[index]["color"] = "secondary";
      setSchemaSelectionButtonColors(btnStates);
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

  return (
    <>
      <FormContext.Provider
        value={{
          updateParent,
          convertedSchema,
          setLoadedFiles,
          loadedFiles,
          handleRemoveFile,
          handleLoadedFiles,
          updateFormDataId,
          handleDataDelete,
          handleConvertedDataInput,
          SEMSelectedDevice,
          schemaSpecification,
          setSchemaSpecification,
          setSEMSelectedDevice,
          implementedFieldTypes,
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
              <Route
                render={({ history }) => (
                  <Button
                    onClick={() => {
                      history.push("/");
                    }}
                  >
                    Home
                  </Button>
                )}
              />
              <div style={{ borderRight: "1px solid #D3D3D3" }}></div>
              {loginState === "false" ? (
                <Button
                  color="primary"
                  onClick={() => setOpenLDAPLoginDialog(true)}
                >
                  LOG IN
                </Button>
              ) : (
                <>
                  <div
                    style={{
                      display: "table-cell",
                      height: "100%",
                      padding: "10px",
                    }}
                  >
                    Hi, {firstName}!
                  </div>
                  <div style={{ borderRight: "1px solid #D3D3D3" }}></div>
                  <Button color="secondary" onClick={() => handleLogOut()}>
                    LOG OUT
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ fontSize: "20px", padding: "10px 10px 0px 10px" }}>
          Please select a workflow:
        </div>
        <div
          style={{
            display: "flex",
            textAlign: "left",
            padding: "10px 10px 0px 10px",
          }}
        >
          {jobRequestConfList.length !== 0 && buttonColorStates.length !== 0
            ? jobRequestConfList.map((content, index) => {
                return (
                  <Button
                    onClick={() => handleJobRequestButton(content, index)}
                    key={index}
                    style={{
                      fontSize: "auto",
                      height: "50px",
                      width: "auto",
                      marginRight: "5px",
                    }}
                    color={buttonColorStates[index]["color"]}
                    variant={buttonColorStates[index]["variant"]}
                  >
                    {content["title"]}
                  </Button>
                );
              })
            : "No job-request config found."}
        </div>
        {renderAvailableSchemas ? (
          <>
            <div style={{ fontSize: "20px", padding: "10px 10px 0px 10px" }}>
              Please select a schema:
            </div>
            <div
              style={{
                display: "flex",
                textAlign: "left",
                padding: "10px 10px 0px 10px",
              }}
            >
              {availableRequestSchemas.length !== 0
                ? availableRequestSchemas.map((content, index) => {
                    return (
                      <Button
                        onClick={() => handleSelectSchema(content, index)}
                        key={index}
                        style={{
                          fontSize: "12px",
                          height: "30px",
                          width: "auto",
                          marginRight: "5px",
                        }}
                        color={schemaSelectionButtonColors[index]["color"]}
                        variant={schemaSelectionButtonColors[index]["variant"]}
                      >
                        {content["schemaTitle"]}
                      </Button>
                    );
                  })
                : "No job-request config found."}
            </div>
          </>
        ) : null}
        <div style={{ padding: "10px" }}>
          <Divider />
        </div>
        {renderReady === true ? (
          <>
            <FormRenderer
              revertAllChanges={revertAllChanges}
              schema={convertedSchema}
              setSchemaSpecification={setSchemaSpecification}
              originalSchema={schema}
              edit={false}
              setEditMode={setEditMode}
            />
          </>
        ) : null}
        <div style={{ padding: "10px" }}>
          <Divider />
        </div>
        {renderReady === true ? (
          <div
            style={{
              padding: "10px 10px",
              width: "100%",
              display: "inline-block",
            }}
          >
            <Button
              onClick={() => handleOnClickProceedButton()}
              style={{ float: "right" }}
              variant="contained"
              color="primary"
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
        ) : null}
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
      />
      {openFormReviewDialog ? (
        <FormReviewBeforeSubmit
          onlineMode={onlineMode}
          openFormReviewDialog={openFormReviewDialog}
          setOpenFormReviewDialog={setOpenFormReviewDialog}
          descriptionList={descriptionList}
          setOpenFunctions={{
            setOpenCreateElabFTWExperimentDialog,
            setOpenJobRequestDialog,
            setOpenDatasetSubmissionDialog,
          }}
          submitFunctions={{ submitJobRequest }}
          submitText={submitText}
          endPoint={window.location.href}
          loadedFiles={loadedFiles}
        />
      ) : null}
      <LDAPLoginDialog
        openLDAPLoginDialog={openLDAPLoginDialog}
        setOpenLDAPLoginDialog={setOpenLDAPLoginDialog}
        setIntranetUsername={setIntranetUsername}
        setUserPassword={setUserPassword}
        token={token}
        setToken={setToken}
        email={email}
        setEmail={setEmail}
        handleLogin={handleLogin}
      />
      <FilesDialog
        openFilesDialog={openFilesDialog}
        setOpenFilesDialog={setFilesDialogContent}
        content={filesDialogContent}
      />
    </>
  );
};

export default AdamantRequest;
