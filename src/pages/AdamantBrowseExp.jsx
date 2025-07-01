import React, { useCallback, useState } from "react";
//import { makeStyles } from "@material-ui/core/styles";
import { useDropzone } from "react-dropzone";
import { Route } from "react-router-dom";
//import QPTDATLogo from "../assets/header-image.png";
import FormRenderer from "../components/FormRenderer";
import Button from "@material-ui/core/Button";
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
//import QPTDATLogo from "../assets/adamant-header-5.svg";
import QPTDATLogo from "../assets/adamant-header-5.svg";
import createDescriptionListFromJSON from "../components/utils/createDescriptionListFromJSON";
import HelpIcon from "@material-ui/icons/HelpOutlineRounded";
import { Tooltip } from "@material-ui/core";
import validateSchemaAgainstSpecification from "../components/utils/validateSchemaAgainstSpecification";
import { Autocomplete } from "@mui/material";
import getPaths from "../components/utils/getPaths";
import checkIDexistence from "../components/utils/checkIDexistence";

import ChooseUseCasesDialog from "../components/ChooseUseCasesDialog";
import LDAPLoginDialog from "../components/LDAPLoginDialog";
import RenderExperimentCard from "../components/RenderExperimentCard";

import EditExperiment from "../components/EditExperiment";
import fillForm from "../components/utils/fillForm";

import AdamantVersion from "../assets/adamant_version.json"
import GeneralConfig from "../general-conf.json"

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

const AdamantBrowseExp = () => {
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
  const [jobRequestSchemas, setJobRequestSchemas] = useState([]);
  const [submitTextList, setSubmitTextList] = useState([]);
  const [submitText, setSubmitText] = useState("Submit Job Request");
  const [openUseCasesDialog, setOpenUseCasesDialog] = useState(true);
  const [openLDAPLoginDialog, setOpenLDAPLoginDialog] = useState(false);
  const [intranetUsername, setIntranetUsername] = useState();
  const [userPassword, setUserPassword] = useState();
  const [loginState, setLoginState] = useState("false");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
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

  // loaded files object
  const [loadedFiles, setLoadedFiles] = useState([]);

  // FilesDialog
  const [openFilesDialog, setOpenFilesDialog] = useState(false);
  const [filesDialogContent, setFilesDialogContent] = useState(["", "", ""]);

  // experiments from eLabFTW
  const [experiments, setExperiments] = useState([]);
  const [experimentData, setExperimentData] = useState({});

  const [retrievedJSONSchema, setRetrievedJSONSchema] = useState();
  const [retrievedJSONData, setRetrievedJSONData] = useState();

  const [toggleJSONForm, setToggleJSONForm] = useState(true);

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
    setExperiments([]);
    setExperimentData({});

    window.sessionStorage.setItem("firstName", "");
    window.sessionStorage.setItem("token", "");
    window.sessionStorage.setItem("loginState", "false");
    window.sessionStorage.setItem("email", "");
  };

  const handleBack2Browse = () => {
    setExperimentData({});
    setSchema(undefined);
    setRetrievedJSONData(undefined);
    setRetrievedJSONSchema(undefined);
    setToggleJSONForm(true)
  };

  // handle select schema on change
  const handleSelectSchemaOnChange = (schemaName) => {
    if (schemaName === null) {
      clearSchemaOnClick();

      return;
    }

    //console.log(event)
    // first reset states
    setRenderReady(false);
    setDisable(true);
    setCreateScratchMode(false);
    setJsonData({});
    //

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

    // convert selectedSchema schema to iterable array properties
    let convertedSchema = JSON.parse(JSON.stringify(selectedSchema));
    try {
      convertedSchema["properties"] = object2array(
        selectedSchema["properties"]
      );

      // update states
      setSchemaValidity(true);
      setSchemaMessage(`${schemaName} is a valid schema`);
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
          setSubmitText(
            submitTextList[jobRequestSchemas.indexOf(convertedSchema["title"])]
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

      // create form data
      let formData = createFormDataBlueprint(selectedSchema["properties"]);
      setJsonData(formData);
    } catch (error) {
      console.log(error);
      // update states
      setSchemaValidity(false);
      setSchemaMessage(`${schemaName} is invalid`);
      setSchema(null);
    }
  };

  // function to check if the file accepted is of json format and json schema valid
  const checkSchemaValidity = (schemaFile, initialData) => {
    console.log("schema:", schemaFile);
    // place holder
    let convertedSchema = JSON.parse(JSON.stringify(schemaFile));
    try {
      convertedSchema["properties"] = object2array(schemaFile["properties"]);

      // update states
      setSchemaValidity(true);
      setSchema(schemaFile);
      let oriSchema = JSON.parse(JSON.stringify(schemaFile));
      setOriginalSchema(oriSchema);
      setSchemaWithValues(JSON.parse(JSON.stringify(oriSchema)));
      fillForm(convertedSchema["properties"], initialData);
      setConvertedSchema(convertedSchema);

      if (jobRequestSchemas.includes(schemaFile["title"])) {
        try {
          //let SEMlogo = require("../assets/sem-header-picture.png");
          //setHeaderImage(SEMlogo["default"]);
          setHeaderImage(QPTDATLogo);
          setEditMode(true);
          setSubmitText(
            submitTextList[
              jobRequestSchemas.findIndex(convertedSchema["title"])
            ]
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

      // create form data
      let formData = createFormDataBlueprint(schemaFile["properties"]);
      setJsonData(formData);
    } catch (error) {
      console.log(error);
      // update states
      setSchemaValidity(false);
      setSchema(null);
    }
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
    let value = deleteKeySchema(jData, path);
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

  // handle download description list
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
    let descList = ``;
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

  // handle download description list
  const handlePrepareDescList = () => {
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

    // Create elab ftw description list and store it to the description list state
    let convSch = { ...convertedSchema };
    // use this if we want to show all fields in description list
    let convProp = JSON.parse(JSON.stringify(convSch["properties"]));
    fillValueWithEmptyString(convProp);
    let cleaned = prepareDataForDescList(convProp); // skip keyword that has value of array with objects as its elements
    // create description list
    let footnote = `<div> This template was generated with <span><a title=https://github.com/csihda/adamant href=https://github.com/csihda/adamant>${AdamantVersion["adamant_version"]}</a></span> </div>`;
    let descList = ``;
    descList += createDescriptionListFromJSON(
      cleaned,
      convSch,
      convProp,
      schema,
      footnote,
      true
    ); // false means without styling

    setDescriptionList(descList);
    setToggleJSONForm(false);
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

  // get available tags from elabftw
  const getExperimentsELabFTW = () => {
    var $ = require("jquery");
    $.ajax({
      type: "POST",
      url: "/api/get_experiments",
      dataType: "json",
      data: {
        eLabURL: eLabURL,
        eLabToken: token,
      },
      success: function (status) {
        console.log("Experiments retrieved successfully");
        //let arr = [];
        //for (let i = 0; i < status.length; i++) {
        //  arr.push(status[i]["tag"]);
        //}
        setExperiments(status);
        /*
        toast.success(`Successfully retrieved the experiments!`, {
          toastId: "fetchingExperimentsSuccess",
        });*/
      },
      error: function (status) {
        console.log("Failed to retrieve experiments");
        console.log(status);
        toast.error(`Failed to get the experiments!\n Not sure why...`, {
          toastId: "fetchingExperimentsError",
        });
      },
    });
  };

  // get available tags from elabftw
  const readExperimentELabFTW = (experimentID) => {
    var $ = require("jquery");
    $.ajax({
      type: "POST",
      url: "/api/read_experiment",
      dataType: "json",
      data: {
        eLabURL: eLabURL,
        eLabToken: token,
        experiment_id: experimentID,
      },
      success: function (status) {
        console.log("Experiment read successfully");
        //let arr = [];
        //for (let i = 0; i < status.length; i++) {
        //  arr.push(status[i]["tag"]);
        //}
        if (status["status"] === 200) {
          setExperimentData(status);
          console.log(status);
          setRetrievedJSONData(status["json_data"]);
          setRetrievedJSONSchema(status["json_schema"]);

          checkSchemaValidity(status["json_schema"], status["json_data"]);
          /*
          toast.success(`Successfully read the experiment!`, {
            toastId: "readingExperimentSuccess",
          });*/
        } else {
          console.log("Failed to read the experiment");
          console.log(status);
          toast.error(
            `Failed to get the experiments!\n No JSON files were found.`,
            {
              toastId: "readingExperimentError",
            }
          );
        }
      },
      error: function (status) {
        console.log("Failed to read the experiment");
        console.log(status);
        toast.error(`Failed to get the experiments!\n Not sure why...`, {
          toastId: "readingExperimentError",
        });
      },
    });
  };

  // get available tags from elabftw
  const updateExperimentELabFTW = (experimentID) => {
    // json schema is schema
    console.log("uploading schema:", schema);
    // -------------------------------------------------------------------------------------------------------

    // json data
    let convSchemaData = { ...convertedSchema };
    let json_data = convData2FormData(
      JSON.parse(JSON.stringify(convSchemaData["properties"]))
    );
    // get rid of empty values in json_data
    json_data = removeEmpty(json_data);
    if (json_data === undefined) {
      json_data = {};
    }
    console.log("uploading json_data", json_data);
    // -------------------------------------------------------------------------------------------------------

    // Create elab ftw description list and store it to the description list state
    let convSch = { ...convertedSchema };
    // use this if we want to show all fields in description list
    let convProp = JSON.parse(JSON.stringify(convSch["properties"]));
    fillValueWithEmptyString(convProp);
    let cleaned = prepareDataForDescList(convProp); // skip keyword that has value of array with objects as its elements
    //let cleaned = removeEmpty(prepareDataForDescList(convSch["properties"]));
    // create description list
    let footnote = `<div> This template was generated with <span><a title=https://github.com/csihda/adamant href=https://github.com/csihda/adamant>${AdamantVersion["adamant_version"]}</a></span> </div>`;
    let descList = ``;
    descList += createDescriptionListFromJSON(
      cleaned,
      convSch,
      convProp,
      schema,
      footnote,
      true
    ); // false means without styling
    console.log("uploading description list:", descList);
    // -------------------------------------------------------------------------------------------------------

    var $ = require("jquery");
    $.ajax({
      type: "POST",
      url: "/api/update_experiment",
      dataType: "json",
      data: {
        eLabURL: eLabURL,
        eLabToken: token,
        experiment_id: experimentID,
        desc_list: descList,
        new_schema: JSON.stringify(schema),
        new_data: JSON.stringify(json_data),
      },
      success: function (status) {
        console.log("Experiment updated successfully");
        toast.success(`Updated.`, {
          toastId: "updateSuccess",
          autoClose: 1000,
        });
      },
      error: function (status) {
        console.log("Failed to update the experiment.");
        toast.error(`Failed to update the experiment.`, {
          toastId: "updateFailed",
          autoClose: 1000,
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
    let descList = ``;
    descList += createDescriptionListFromJSON(
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

  // gather all loaded files in one object
  const handleLoadedFiles = (file) => {
    let files = loadedFiles;
    //console.log(files);

    // check if file already exists
    let isFileAlreadyExist = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i]["name"] === file["name"]) {
        isFileAlreadyExist = true;
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
          loadedFiles,
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
        {Object.keys(experimentData).length === 0 ? (
          <>
            <div style={{ fontSize: "20px", padding: "10px 10px 0px 10px" }}>
              Make sure you are <strong>logged in</strong>!
            </div>
            <div
              style={{
                display: "flex",
                textAlign: "left",
                padding: "10px 10px 0px 10px",
              }}
            >
              <Button
                style={{
                  fontSize: "auto",
                  height: "50px",
                  width: "auto",
                  marginRight: "5px",
                }}
                variant="contained"
                color="primary"
                disabled={loginState === "false" ? true : false}
                onClick={() => getExperimentsELabFTW()}
              >
                Browse experiments
              </Button>
            </div>{" "}
          </>
        ) : null}
        <div style={{ padding: "10px" }}>
          <Divider />
        </div>

        {Object.keys(experimentData).length === 0 ? (
          <RenderExperimentCard
            experiments={experiments}
            readExperimentELabFTW={readExperimentELabFTW}
          />
        ) : /*
          <EditExperiment
            retrievedJSONSchema ={retrievedJSONSchema}
            retrievedJSONData = {retrievedJSONData}
            experimentData={experimentData}
        />*/
        convertedSchema !== null ? (
          <>
            <div
              style={{
                paddingLeft: "10px",
                marginTop: "-8px",
                display: "flex",
                width: "100%",
              }}
            >
              <Button
                color={toggleJSONForm ? "default" : "default"}
                onClick={() => setToggleJSONForm(true)}
                variant={!toggleJSONForm ? "contained" : "default"}
              >
                JSON FORM
              </Button>
              {/*<div style={{ borderRight: "1px solid #D3D3D3" }}></div>*/}
              <Button
                color={!toggleJSONForm ? "default" : "default"}
                onClick={() => handlePrepareDescList()}
                variant={toggleJSONForm ? "contained" : "default"}
              >
                HTML FORM
              </Button>
            </div>
            {toggleJSONForm ? (
              <FormRenderer
                revertAllChanges={revertAllChanges}
                schema={convertedSchema}
                setSchemaSpecification={setSchemaSpecification}
                originalSchema={schema}
                edit={editMode}
                setEditMode={setEditMode}
              />
            ) : (
              <div
                style={{ padding: "10px" }}
                dangerouslySetInnerHTML={{ __html: descriptionList }}
              ></div>
            )}
          </>
        ) : null}
        <div style={{ padding: "10px" }}>
          <Divider />
        </div>
        {Object.keys(experimentData).length !== 0 ? (
          <div
            style={{
              width: "100%",
              display: "flex",
              padding: "10px 10px",
            }}
          >
            <div style={{ width: "50%" }}>
              <Button
                onClick={() => handleBack2Browse()}
                style={{ float: "left", marginRight: "5px" }}
                variant="outlined"
              >
                Back to Browse
              </Button>
            </div>
            <div style={{ width: "50%" }}>
              <Button
                style={{ float: "right", marginRight: "5px" }}
                variant="contained"
                color="primary"
                onClick={() =>
                  updateExperimentELabFTW(experimentData["experiment_id"])
                }
              >
                Update Experiment
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
      {openFormReviewDialog ? (
        <FormReviewBeforeSubmit
          onlineMode={onlineMode}
          openFormReviewDialog={openFormReviewDialog}
          setOpenFormReviewDialog={setOpenFormReviewDialog}
          descriptionList={descriptionList}
          setOpenFunctions={{
            setOpenCreateElabFTWExperimentDialog,
            setOpenJobRequestDialog,
          }}
          submitFunctions={{ submitJobRequest }}
          submitText={submitText}
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
    </>
  );
};

export default AdamantBrowseExp;
