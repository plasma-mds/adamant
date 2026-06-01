import React, { useContext, useEffect, useState, useCallback} from 'react'
import set from "set-value";
import TextField from "@material-ui/core/TextField"
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import checkIfFieldIDExist from './utils/checkIfFieldIDExist';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { FormContext } from '../FormContext';
import { Checkbox } from '@material-ui/core';
import { FormGroup } from '@material-ui/core';
import updateRequired from './utils/updateRequired';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from "@material-ui/icons/AddBox";
import DeleteIcon from "@material-ui/icons/Delete";
import getValue from './utils/getValue';
import { useDropzone } from "react-dropzone";
import object2array from './utils/object2array';
import convertedSchemaPropertiesSort from './utils/convertedSchemaPropertiesSort';
import getFileIndex from './utils/getFileIndex';
import getValueInSchemaFullPath from './utils/getValueInSchemaFullPath';

const getAllFileMetadata = (object, arr) => {
    let arrai = arr
    Object.keys(object).forEach((key) => {
        if (typeof object[key] === "object") {
            getAllFileMetadata(object[key], arrai)
        }
        if (typeof object[key] === "string") {
            if (object[key].includes("fileupload:") && object[key].split(";").length === 3) {
                arr.push(object[key])
            }
        }
    })
    return arrai
}

/*const useStyles = makeStyles((theme) => ({
    root: {
        width: 'auto',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
})); */
const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    input: {
        fontSize: "12px",
        fontFamily: "monospace"
    }
}));


const EditElement = ({ editOrAdd, field_uri, enumerated, field_enumerate, field_required, field_key, UISchema, path, pathFormData, openDialog, setOpenDialog, defaultValue, field_label }) => {

    const [selectedType, setSelectedType] = useState(UISchema !== undefined ? UISchema["type"] : "string")
    const [title, setTitle] = useState(UISchema !== undefined ? UISchema["title"] : "")
    const [fieldkey, setFieldKey] = useState(UISchema !== undefined ? UISchema["fieldKey"] : "")
    const [oldFieldkey, setOldFieldkey] = useState(UISchema !== undefined ? UISchema["fieldKey"] : "")
    const [fieldUri, setFieldUri] = useState(UISchema !== undefined ? UISchema["$id"] : "")
    const [description, setDescription] = useState(UISchema !== undefined ? UISchema["description"] : "")
    const [defValue, setDefValue] = useState(defaultValue !== undefined ? defaultValue : "")
    const { loadedFiles, handleRemoveFile, updateParent, convertedSchema: _convertedSchema, updateFormDataId, schemaSpecification, handleDataDelete, handleCheckIDexistence } = useContext(FormContext);
    const convertedSchema = _convertedSchema ? JSON.parse(JSON.stringify(_convertedSchema)) : null;
    const [requiredChecked, setRequiredChecked] = useState(field_required === undefined ? false : field_required)
    const [enumChecked, setEnumChecked] = useState(enumerated === undefined ? false : enumerated)
    const [enumList, setEnumList] = useState(field_enumerate === undefined ? [] : field_enumerate);
    const [arrayItemType, setArrayItemType] = useState("string")
    const [arrayMinMaxItem, setArrayMinMaxItem] = useState(["None", "None"])
    const [numberMinMaxValue, setNumberMinMaxValue] = useState(["None", "None"])
    const [charMinMaxLengthValue, setCharMinMaxLengthValue] = useState(["None", "None"])
    const [charMinMaxHelperText, setCharMinMaxHelperText] = useState("Set the minimum and maximum length allowed for this string input.")
    const [arrayMinMaxHelperText, setArrayMinMaxHelperText] = useState("Set the minimum and maximum values of the items allowed for this array field.")
    const [numberMinMaxValueHelperText, setNumberMinMaxValueHelpertext] = useState("Set the minimum and maximum values of this field.")
    const [arrayUniqueItems, setArrayUniqueItems] = useState(UISchema !== undefined ? (UISchema["uniqueItems"] !== undefined ? UISchema["uniqueItems"] : false) : false)
    const [subSchemaValidity, setSubSchemaValidity] = useState(false);
    const [convertedSubSchema, setConvertedSubSchema] = useState({})
    const [subSchemaFilename, setSubSchemaFilename] = useState("")
    const [activeSubSchemaButton, setActiveSubSchemaButton] = useState("")
    const [arrayItemDataType, setArrayItemDataType] = useState("")
    const [itemSchemaTFrow,setItemSchemaTFrow] = useState(false)
    const [itemSchemaEdit, setItemSchemaEdit] = useState(false)
    const [itemSchemaData, setItemSchemaData] = useState("")
    const [isTuple, setIsTuple] = useState(false)
    const [tupleItems, setTupleItems] = useState([])
    const [numberExclusiveMinMax, setNumberExclusiveMinMax] = useState(["None", "None"])
    const [multipleOfValue, setMultipleOfValue] = useState("None")
    const [patternValue, setPatternValue] = useState("")
    const [formatValue, setFormatValue] = useState("")

    let arrayItemTypeList = ["string", "number", "integer", "object"]
    if (UISchema !== undefined) {
        if (UISchema["items"] !== undefined) {
            if (UISchema["items"]["type"] === "object") {
                arrayItemTypeList = ["string", "number", "integer", "object"]
            }
        }
    }

    const classes = useStyles();

    useEffect(() => {
        if (field_uri !== undefined) {
            setFieldUri(field_uri)
        }
        else if (UISchema["$id"] !== undefined) {
            setFieldUri(UISchema["$id"])
        }
        else {
            setFieldUri("")
        }
        // for array
        if (UISchema !== undefined) {
            if (UISchema["type"] === "array") {
                const hasPrefixItems = UISchema["prefixItems"] !== undefined
                const hasArrayItems = Array.isArray(UISchema["items"])
                if (hasPrefixItems || hasArrayItems) {
                    // tuple array
                    setIsTuple(true)
                    const src = hasPrefixItems ? UISchema["prefixItems"] : UISchema["items"]
                    setTupleItems(src.map(item => ({
                        type: item["type"] || "string",
                        title: item["title"] || "",
                        description: item["description"] || ""
                    })))
                } else {
                    const itemsObj = UISchema["items"] || { "type": "string" }
                    setArrayItemDataType(itemsObj["type"])
                    setArrayItemType(itemsObj["type"])
                    setItemSchemaData(JSON.stringify(itemsObj, null, 2))
                    if (UISchema["items"] === undefined) {
                        UISchema["items"] = { "type": "string" }
                    }
                }
                let value = [...arrayMinMaxItem]
                if (UISchema["minItems"] !== undefined) {
                    value[0] = UISchema["minItems"]
                }
                if (UISchema["maxItems"] !== undefined) {
                    value[1] = UISchema["maxItems"]
                }
                if (arrayUniqueItems) {
                    UISchema["uniqueItems"] = arrayUniqueItems
                }
                else {
                    delete UISchema["uniqueItems"]
                }
                setArrayMinMaxItem(value)
            }
            else {
                UISchema["items"] = "None"
            }
        }

        // for numeric types
        if (UISchema !== undefined) {
            if (["number", "integer"].includes(UISchema["type"])) {
                let value = [...numberMinMaxValue]
                if (UISchema["minimum"] !== undefined) {
                    value[0] = UISchema["minimum"]
                }
                if (UISchema["maximum"] !== undefined) {
                    value[1] = UISchema["maximum"]
                }
                setNumberMinMaxValue(value)
                let excValue = ["None", "None"]
                if (UISchema["exclusiveMinimum"] !== undefined) { excValue[0] = UISchema["exclusiveMinimum"] }
                if (UISchema["exclusiveMaximum"] !== undefined) { excValue[1] = UISchema["exclusiveMaximum"] }
                setNumberExclusiveMinMax(excValue)
                if (UISchema["multipleOf"] !== undefined) { setMultipleOfValue(UISchema["multipleOf"]) }
            }
        }

        // for string type
        if (UISchema !== undefined) {
            if (UISchema["type"] === "string") {
                let value = [...charMinMaxLengthValue]
                if (UISchema["minLength"] !== undefined) {
                    value[0] = UISchema["minLength"]
                }
                if (UISchema["maxLength"] !== undefined) {
                    value[1] = UISchema["maxLength"]
                }
                setCharMinMaxLengthValue(value)
                if (UISchema["pattern"] !== undefined) { setPatternValue(UISchema["pattern"]) }
                if (UISchema["format"] !== undefined) { setFormatValue(UISchema["format"]) }
            }
        }
    }, [])


    let tempUISchema
    if (editOrAdd !== undefined && editOrAdd === "add") {
        UISchema = {
            "type": "string",
            "fieldKey": "",
            "title": "",
            "description": "",
            "items": "None"
        }
        tempUISchema = {
            "type": "string",
            "fieldKey": "",
            "title": "",
            "description": "",
            "items": "None"
        }
    } else {
        tempUISchema = JSON.parse(JSON.stringify(UISchema))
    }

    let notImplemented = false;
    if (UISchema !== undefined) {
        if (!["string", "number", "integer", "object", "array", "boolean", "null", "fileupload (string)"].includes(UISchema["type"])) {
            notImplemented = true;
        }
    }


    let datatypes = ["string", "number", "integer", "object", "array", "boolean", "null", "fileupload (string)"]


    const handleOnChangeListField = (event) => {
        setEnumList(event.target.value);
    }

    // save the change and update the UI
    const handleUpdateSchemaOnClick = () => {
        // check if field id/uri already exists or not
        if (fieldUri !== tempUISchema["$id"] && fieldUri !== tempUISchema["id"]){
            //alert(fieldUri+","+tempUISchema["$id"])
            if (handleCheckIDexistence(fieldUri)) {
                alert("A field element with the same Field ID/URI already exists. Either change the ID or remove it.")
                return
            }
        }

        if (itemSchemaEdit) {
            alert("You must save the array item schema first.")
            return
        }
        // do this if add
        if (editOrAdd === "add") {
            // update default value
            let defValueState = defValue
            if (selectedType === 'number' && defValueState !== "" && defaultValue !== undefined) {
                defValueState = parseFloat(defValueState)
            }
            if (selectedType === 'integer' && defValueState !== "" && defaultValue !== undefined) {
                defValueState = parseInt(defValueState)
            }
            if (defValueState === undefined & defaultValue === undefined) {
                // do nothing
            } else if (defValueState.toString().replace(/\s+/g, '') === "" & defaultValue === undefined) {
                // do nothing
            } else if (selectedType === "boolean" & defValueState.toString().replace(/\s+/g, '') === "" & defaultValue === undefined) {
                // do nothing
            } else if (selectedType === "boolean" & defValueState.toString().replace(/\s+/g, '') !== "") {
                tempUISchema["defaultValue"] = (defValueState === "true" ? true : false)
            } else if (defValueState.toString().replace(/\s+/g, '') === "") {
                delete tempUISchema["defaultValue"]
            }
            else {
                //console.log("default value:", defValue)
                //console.log("type default value:", typeof defValue)
                tempUISchema["defaultValue"] = defValueState
            };

            // check if fieldkey already exist
            if (checkIfFieldIDExist(convertedSchema, path, fieldkey)) {
                alert("Field Keyword already exists!")
                return
            }

            tempUISchema["fieldKey"] = fieldkey;
            if (fieldUri !== undefined) {
                if (fieldUri.toString().replace(/\s+/g, '') !== "") {
                    tempUISchema["$id"] = fieldUri
                }
            }
            tempUISchema["type"] = selectedType;
            if (title !== undefined) { tempUISchema["title"] = title }
            if (description !== undefined) { tempUISchema["description"] = description }

            if (fieldkey === undefined) {
                alert("Field Keyword must be defined!")
                return
            }

            if (typeof (fieldkey) === "string" & fieldkey.replace(/\s+/g, '') === "") {
                alert("Field Keyword must be defined!")
                return
            }
            if (tempUISchema["type"] === "object" & subSchemaValidity) {
                // delete json data for this path first
                //handleDataDelete(pathFormData)

                tempUISchema["properties"] = convertedSubSchema["properties"]
                // check required
                try {
                    if (convertedSubSchema["required"] !== undefined) {
                        tempUISchema["required"] = convertedSubSchema["required"]
                    } else {
                        delete tempUISchema["required"]
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            if (tempUISchema["type"] === "object" & !subSchemaValidity) {
                // delete json data for this path first
                //handleDataDelete(pathFormData)

                tempUISchema["properties"] = []
                // check required
                try {
                    if (convertedSubSchema["required"] !== undefined) {
                        tempUISchema["required"] = convertedSubSchema["required"]
                    } else {
                        delete tempUISchema["required"]
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            /*
            if (tempUISchema["type"] === "object") {
                if (subSchemaValidity) {
                    tempUISchema["properties"] = convertedSubSchema["properties"]
                } else {
                    tempUISchema["properties"] = []
                }

                // check required
                try {
                    tempUISchema["required"] = convertedSubSchema["required"]
                } catch (error) {
                    console.log(error)
                }
            }*/
            // more validation keywords for array
            if (tempUISchema["type"] === "array") {
                // remove value
                delete tempUISchema["value"]

                if (isTuple && tupleItems.length > 0) {
                    const cleanTuple = tupleItems.map(item => {
                        const obj = { type: item.type }
                        if (item.title) obj.title = item.title
                        if (item.description) obj.description = item.description
                        return obj
                    })
                    if (schemaSpecification && schemaSpecification.includes("2020-12")) {
                        tempUISchema["prefixItems"] = cleanTuple
                        delete tempUISchema["items"]
                    } else {
                        tempUISchema["items"] = cleanTuple
                        delete tempUISchema["prefixItems"]
                    }
                } else {
                    if (arrayItemType === "string") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    if (arrayItemType === "integer") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    if (arrayItemType === "number") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    if (arrayItemType === "object") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    delete tempUISchema["prefixItems"]
                }
                if (arrayMinMaxItem[0] !== "None") {
                    tempUISchema["minItems"] = arrayMinMaxItem[0]
                } else {
                    delete tempUISchema["minItems"]
                }
                if (arrayMinMaxItem[1] !== "None") {
                    tempUISchema["maxItems"] = arrayMinMaxItem[1]
                } else {
                    delete delete tempUISchema["maxItems"]
                }

                if (arrayUniqueItems) {
                    tempUISchema["uniqueItems"] = arrayUniqueItems
                }
                else {
                    delete tempUISchema["uniqueItems"]
                }

                delete tempUISchema["required"]
                if (UISchema["type"] === "object") {
                    delete tempUISchema["properties"]
                }
            }
            // more validation keywords for numeric types
            if (["number", "integer"].includes(tempUISchema["type"])) {
                // delete all unrelated keywords
                delete tempUISchema["items"]
                delete tempUISchema["prefixItems"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]
                delete tempUISchema["pattern"]
                delete tempUISchema["format"]
                delete tempUISchema["minLength"]
                delete tempUISchema["maxLength"]
                if (numberMinMaxValue[0] !== "None") {
                    tempUISchema["minimum"] = numberMinMaxValue[0]
                } else {
                    delete tempUISchema["minimum"]
                }
                if (numberMinMaxValue[1] !== "None") {
                    tempUISchema["maximum"] = numberMinMaxValue[1]
                } else {
                    delete tempUISchema["maximum"]
                }
                if (numberExclusiveMinMax[0] !== "None") {
                    tempUISchema["exclusiveMinimum"] = numberExclusiveMinMax[0]
                } else {
                    delete tempUISchema["exclusiveMinimum"]
                }
                if (numberExclusiveMinMax[1] !== "None") {
                    tempUISchema["exclusiveMaximum"] = numberExclusiveMinMax[1]
                } else {
                    delete tempUISchema["exclusiveMaximum"]
                }
                if (multipleOfValue !== "None" && multipleOfValue !== "") {
                    tempUISchema["multipleOf"] = multipleOfValue
                } else {
                    delete tempUISchema["multipleOf"]
                }
            }
            // more validation keywords for string
            if (tempUISchema["type"] === "string") {
                // delete all unrelated keywords
                delete tempUISchema["items"]
                delete tempUISchema["prefixItems"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]
                delete tempUISchema["exclusiveMinimum"]
                delete tempUISchema["exclusiveMaximum"]
                delete tempUISchema["multipleOf"]
                if (charMinMaxLengthValue[0] !== "None") {
                    tempUISchema["minLength"] = charMinMaxLengthValue[0]
                } else {
                    delete tempUISchema["minLength"]
                }
                if (charMinMaxLengthValue[1] !== "None") {
                    tempUISchema["maxLength"] = charMinMaxLengthValue[1]
                } else {
                    delete tempUISchema["maxLength"]
                }
                if (patternValue !== "") {
                    tempUISchema["pattern"] = patternValue
                } else {
                    delete tempUISchema["pattern"]
                }
                if (formatValue !== "") {
                    tempUISchema["format"] = formatValue
                } else {
                    delete tempUISchema["format"]
                }
            }
            // null type has no type-specific validation keywords
            if (tempUISchema["type"] === "null") {
                delete tempUISchema["items"]
                delete tempUISchema["prefixItems"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]
                delete tempUISchema["exclusiveMinimum"]
                delete tempUISchema["exclusiveMaximum"]
                delete tempUISchema["multipleOf"]
                delete tempUISchema["pattern"]
                delete tempUISchema["format"]
                delete tempUISchema["minLength"]
                delete tempUISchema["maxLength"]
                delete tempUISchema["required"]
                delete tempUISchema["value"]
                delete tempUISchema["defaultValue"]
            }

            if (tempUISchema["type"] !== "string") {
                setEnumChecked(false);
            }

            // get rid of array-specific keywords if selectedType is not array
            if (selectedType !== "array" & tempUISchema["items"] !== undefined) {
                delete tempUISchema["items"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
            }

            if (selectedType === "fileupload (string)" && schemaSpecification === "http://json-schema.org/draft-04/schema#") {
                delete tempUISchema["contentEncoding"]
            }

            // for fileupload
            if (selectedType === "fileupload (string)") {
                // set type to string
                tempUISchema["type"] = "string"
                // set the encoding type
                tempUISchema["contentEncoding"] = "base64"
                // delete all unrelated keywords
                delete tempUISchema["items"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["maxLength"]
                delete tempUISchema["minLength"]
                delete tempUISchema["enumerate"]
                delete tempUISchema["enum"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]

                // set tempUISchema.value to emptystring
                tempUISchema["value"] = ""
            }

            if (path !== undefined) {

                let properties = getValue(convertedSchema, path)["properties"]
                properties.push(tempUISchema)
                set(convertedSchema, path + ".properties", properties)

                // create a new path to the new element
                path = path + ".properties." + (properties.length - 1).toString()
                // update the required value
                let old_field_key = oldFieldkey
                let field_key = fieldkey
                let newConvertedSchema = updateRequired({ selectedType, path, requiredChecked, field_key, old_field_key, convertedSchema })
                // update enum
                if (tempUISchema["type"] === "string" & enumChecked) {
                    let newList = enumList
                    if (Array.isArray(newList)) {
                        set(newConvertedSchema, path + ".enumerate", newList)
                    } else {
                        newList = newList.replace(/\s*,\s*/g, ",")
                        set(newConvertedSchema, path + ".enumerate", newList.split(","))
                    }

                }

                // delete the file if it's not fileupload and if the file exists
                if (UISchema["type"] === "fileupload (string)") {
                    if (UISchema["value"] !== undefined) {
                        if (typeof UISchema["value"] === "string") {
                            if (UISchema["value"].includes("fileupload:") && UISchema["value"].split(";").length === 3) {
                                let fileIndex = getFileIndex(loadedFiles, UISchema["value"])
                                handleRemoveFile(fileIndex)
                            }
                        }
                    }
                }
                // delete all files if the new type is not object
                // remove the file in loadedFiles
                if (UISchema["type"] === "object" && tempUISchema["type"] !== "object") {
                    let cSchema = JSON.parse(JSON.stringify(convertedSchema))
                        set(cSchema, path + ".properties", UISchema["properties"])
                    let metmet = getValueInSchemaFullPath(cSchema, path + ".properties")
                    const fileMetadata = getAllFileMetadata(metmet, [])
                    if (fileMetadata.length > 0) {
                        for (let i = 0; i < fileMetadata.length; i++) {
                            const fileIndex = getFileIndex(loadedFiles, fileMetadata[i])
                            handleRemoveFile(fileIndex)
                        }
                    }
                }
                // delete all files if the new type is not array
                if (UISchema["type"] === "array" && tempUISchema["type"] !== "array") {
                    // remove the file in loadedFiles
                    const fileMetadata = getValue(convertedSchema, path + `.value`)
                    console.log("fileMetadata:", fileMetadata)
                    if (fileMetadata !== undefined) {
                        let keywords = []
                        if (Array.isArray(fileMetadata)) {
                            if (fileMetadata.length > 0) {
                                for (let i = 0; i < fileMetadata.length; i++) {
                                    if (typeof fileMetadata[i] === "object") {
                                        Object.keys(fileMetadata[i]).forEach((key) => {
                                            if (typeof fileMetadata[i][key] === "string") {
                                                if (fileMetadata[i][key].includes("fileupload:") && fileMetadata[i][key].split(";").length === 3) {
                                                    keywords.push(fileMetadata[i][key])
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                        if (keywords.length > 0) {
                            for (let i = 0; i < keywords.length; i++) {
                                const fileIndex = getFileIndex(loadedFiles, keywords[i])
                                handleRemoveFile(fileIndex)
                            }
                        }
                    }
                    // remove the value in general
                    let temporary = getValue(convertedSchema, path)
                    delete temporary["value"]
                    set(newConvertedSchema, path, temporary)
                }
                // update main component
                updateParent(newConvertedSchema)
                setOpenDialog(false)
            } else {
                let properties = convertedSchema["properties"]
                properties.push(tempUISchema)
                convertedSchema["properties"] = properties

                // create a new path to the new element
                path = "properties." + (properties.length - 1).toString()
                // update the required value
                let old_field_key = oldFieldkey
                let field_key = fieldkey
                let newConvertedSchema = updateRequired({ selectedType, path, requiredChecked, field_key, old_field_key, convertedSchema })
                // update enum
                if (tempUISchema["type"] === "string" & enumChecked) {
                    let newList = enumList
                    if (Array.isArray(newList)) {
                        set(newConvertedSchema, path + ".enumerate", newList)
                    } else {
                        newList = newList.replace(/\s*,\s*/g, ",")
                        set(newConvertedSchema, path + ".enumerate", newList.split(","))
                    }

                }


                // delete the file if it's not fileupload and if the file exists
                if (UISchema["type"] === "fileupload (string)") {
                    if (UISchema["value"] !== undefined) {
                        if (typeof UISchema["value"] === "string") {
                            if (UISchema["value"].includes("fileupload:") && UISchema["value"].split(";").length === 3) {
                                let fileIndex = getFileIndex(loadedFiles, UISchema["value"])
                                handleRemoveFile(fileIndex)
                            }
                        }
                    }
                }
                // delete all files if the new type is not object
                // remove the file in loadedFiles
                if (UISchema["type"] === "object" && tempUISchema["type"] !== "object") {
                    let cSchema = JSON.parse(JSON.stringify(convertedSchema))
                        set(cSchema, path + ".properties", UISchema["properties"])
                    let metmet = getValueInSchemaFullPath(cSchema, path + ".properties")
                    const fileMetadata = getAllFileMetadata(metmet, [])
                    if (fileMetadata.length > 0) {
                        for (let i = 0; i < fileMetadata.length; i++) {
                            const fileIndex = getFileIndex(loadedFiles, fileMetadata[i])
                            handleRemoveFile(fileIndex)
                        }
                    }
                }
                // delete all files if the new type is not array
                if (UISchema["type"] === "array" && tempUISchema["type"] !== "array") {
                    // remove the file in loadedFiles
                    const fileMetadata = getValue(convertedSchema, path + `.value`)
                    console.log("fileMetadata:", fileMetadata)
                    if (fileMetadata !== undefined) {
                        let keywords = []
                        if (Array.isArray(fileMetadata)) {
                            if (fileMetadata.length > 0) {
                                for (let i = 0; i < fileMetadata.length; i++) {
                                    if (typeof fileMetadata[i] === "object") {
                                        Object.keys(fileMetadata[i]).forEach((key) => {
                                            if (typeof fileMetadata[i][key] === "string") {
                                                if (fileMetadata[i][key].includes("fileupload:") && fileMetadata[i][key].split(";").length === 3) {
                                                    keywords.push(fileMetadata[i][key])
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                        if (keywords.length > 0) {
                            for (let i = 0; i < keywords.length; i++) {
                                const fileIndex = getFileIndex(loadedFiles, keywords[i])
                                handleRemoveFile(fileIndex)
                            }
                        }
                    }
                    // remove the value in general
                    let temporary = getValue(convertedSchema, path)
                    delete temporary["value"]
                    set(newConvertedSchema, path, temporary)
                }
                // update main component
                updateParent(newConvertedSchema)
                setOpenDialog(false)
            }
        }
        else { // and do this if edit
            // update default value
            let defValueState = defValue
            if (selectedType === 'number' && defValueState !== "" && defaultValue !== undefined) {
                defValueState = parseFloat(defValueState)
            }
            if (selectedType === 'integer' && defValueState !== "" && defaultValue !== undefined) {
                defValueState = parseInt(defValueState)
            }
            if (defValueState === undefined & defaultValue === undefined) {
                // do nothing
            } else if (defValueState.toString().replace(/\s+/g, '') === "" & defaultValue === undefined) {
                // do nothing
            } else if (selectedType === "boolean" & defValueState.toString().replace(/\s+/g, '') === "" & defaultValue === undefined) {
                // do nothing
            } else if (selectedType === "boolean" & defValueState.toString().replace(/\s+/g, '') !== "") {
                tempUISchema["defaultValue"] = (defValueState === "true" ? true : false)
            } else if (defValueState.toString().replace(/\s+/g, '') === "") {
                delete tempUISchema["defaultValue"]
            }
            else {
                //console.log("default value:", defValue)
                //console.log("type default value:", typeof defValue)
                tempUISchema["defaultValue"] = defValueState
            };

            // check if fieldkey already exist
            let existed = checkIfFieldIDExist(convertedSchema, path, fieldkey)
            if (UISchema["fieldKey"] !== fieldkey) {
                if (existed) {
                    alert("Field Keyword already exists!")
                    return
                }
            }

            if (fieldkey === undefined | fieldkey.replace(/\s+/g, '') === "") {
                alert("Field Keyword must be defined!")
                return
            }

            tempUISchema["fieldKey"] = fieldkey;
            if (fieldUri !== undefined) {
                if (fieldUri.toString().replace(/\s+/g, '') !== "") {
                    tempUISchema["$id"] = fieldUri
                }
            }
            tempUISchema["type"] = selectedType;
            if (title !== undefined) { tempUISchema["title"] = title }
            if (description !== undefined) { tempUISchema["description"] = description }

            if (tempUISchema["type"] === "object" & tempUISchema["properties"] === undefined) {
                // delete json data for this path first
                //handleDataDelete(pathFormData)
                tempUISchema["properties"] = []
            }
            if (tempUISchema["type"] === "object" & subSchemaValidity) {
                // delete json data for this path first
                //handleDataDelete(pathFormData)
                tempUISchema["properties"] = convertedSubSchema["properties"]
                // check required
                try {
                    if (convertedSubSchema["required"] !== undefined) {
                        tempUISchema["required"] = convertedSubSchema["required"]
                    } else {
                        delete tempUISchema["required"]
                    }
                } catch (error) {
                    console.log(error)
                }
            }

            // more validation keywords for array
            if (tempUISchema["type"] === "array") {
                // remove value
                delete tempUISchema["value"]

                if (isTuple && tupleItems.length > 0) {
                    const cleanTuple = tupleItems.map(item => {
                        const obj = { type: item.type }
                        if (item.title) obj.title = item.title
                        if (item.description) obj.description = item.description
                        return obj
                    })
                    if (schemaSpecification && schemaSpecification.includes("2020-12")) {
                        tempUISchema["prefixItems"] = cleanTuple
                        delete tempUISchema["items"]
                    } else {
                        tempUISchema["items"] = cleanTuple
                        delete tempUISchema["prefixItems"]
                    }
                } else {
                    if (arrayItemType === "string") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    if (arrayItemType === "integer") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    if (arrayItemType === "number") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    if (arrayItemType === "object") {
                        tempUISchema["items"] = JSON.parse(itemSchemaData)
                    }
                    delete tempUISchema["prefixItems"]
                }
                if (arrayMinMaxItem[0] !== "None") {
                    tempUISchema["minItems"] = arrayMinMaxItem[0]
                } else {
                    delete tempUISchema["minItems"]
                }
                if (arrayMinMaxItem[1] !== "None") {
                    tempUISchema["maxItems"] = arrayMinMaxItem[1]
                } else {
                    delete delete tempUISchema["maxItems"]
                }

                if (arrayUniqueItems) {
                    tempUISchema["uniqueItems"] = arrayUniqueItems
                }
                else {
                    delete tempUISchema["uniqueItems"]
                }

                delete tempUISchema["required"]
                if (UISchema["type"] === "object") {
                    delete tempUISchema["properties"]
                }
            }
            // more validation keywords for numeric types
            if (["number", "integer"].includes(tempUISchema["type"])) {
                // delete all unrelated keywords
                delete tempUISchema["items"]
                delete tempUISchema["prefixItems"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]
                delete tempUISchema["pattern"]
                delete tempUISchema["format"]
                delete tempUISchema["minLength"]
                delete tempUISchema["maxLength"]
                if (numberMinMaxValue[0] !== "None") {
                    tempUISchema["minimum"] = numberMinMaxValue[0]
                } else {
                    delete tempUISchema["minimum"]
                }
                if (numberMinMaxValue[1] !== "None") {
                    tempUISchema["maximum"] = numberMinMaxValue[1]
                } else {
                    delete delete tempUISchema["maximum"]
                }
                if (numberExclusiveMinMax[0] !== "None") {
                    tempUISchema["exclusiveMinimum"] = numberExclusiveMinMax[0]
                } else {
                    delete tempUISchema["exclusiveMinimum"]
                }
                if (numberExclusiveMinMax[1] !== "None") {
                    tempUISchema["exclusiveMaximum"] = numberExclusiveMinMax[1]
                } else {
                    delete tempUISchema["exclusiveMaximum"]
                }
                if (multipleOfValue !== "None" && multipleOfValue !== "") {
                    tempUISchema["multipleOf"] = multipleOfValue
                } else {
                    delete tempUISchema["multipleOf"]
                }
            }
            // more validation keywords for string
            if (tempUISchema["type"] === "string") {
                // delete all unrelated keywords
                delete tempUISchema["items"]
                delete tempUISchema["prefixItems"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]
                delete tempUISchema["exclusiveMinimum"]
                delete tempUISchema["exclusiveMaximum"]
                delete tempUISchema["multipleOf"]
                if (charMinMaxLengthValue[0] !== "None") {
                    tempUISchema["minLength"] = charMinMaxLengthValue[0]
                } else {
                    delete tempUISchema["minLength"]
                }
                if (charMinMaxLengthValue[1] !== "None") {
                    tempUISchema["maxLength"] = charMinMaxLengthValue[1]
                } else {
                    delete tempUISchema["maxLength"]
                }
                if (patternValue !== "") {
                    tempUISchema["pattern"] = patternValue
                } else {
                    delete tempUISchema["pattern"]
                }
                if (formatValue !== "") {
                    tempUISchema["format"] = formatValue
                } else {
                    delete tempUISchema["format"]
                }
            }
            // null type has no type-specific validation keywords
            if (tempUISchema["type"] === "null") {
                delete tempUISchema["items"]
                delete tempUISchema["prefixItems"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]
                delete tempUISchema["exclusiveMinimum"]
                delete tempUISchema["exclusiveMaximum"]
                delete tempUISchema["multipleOf"]
                delete tempUISchema["pattern"]
                delete tempUISchema["format"]
                delete tempUISchema["minLength"]
                delete tempUISchema["maxLength"]
                delete tempUISchema["required"]
                delete tempUISchema["value"]
                delete tempUISchema["defaultValue"]
            }


            if (!["string", "integer", "number"].includes(tempUISchema["type"])) {
                setEnumChecked(false);
            }

            // get rid of array-specific keywords if selectedType is not array
            if (selectedType !== "array" & tempUISchema["items"] !== undefined) {
                delete tempUISchema["items"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
            }

            // for fileupload
            if (selectedType === "fileupload (string)") {
                // set type to string
                tempUISchema["type"] = "string"
                // set the encoding type
                tempUISchema["contentEncoding"] = "base64"
                // delete all unrelated keywords
                delete tempUISchema["items"]
                delete tempUISchema["minItems"]
                delete tempUISchema["maxItems"]
                delete tempUISchema["uniqueItems"]
                delete tempUISchema["maxLength"]
                delete tempUISchema["minLength"]
                delete tempUISchema["enumerate"]
                delete tempUISchema["enum"]
                delete tempUISchema["properties"]
                delete tempUISchema["maximum"]
                delete tempUISchema["minimum"]

                // set tempUISchema.value to emptystring
                tempUISchema["value"] = ""
            }

            set(convertedSchema, path, tempUISchema)
            // update the required value
            let old_field_key = oldFieldkey
            let field_key = fieldkey
            let newConvertedSchema = updateRequired({ selectedType, path, requiredChecked, field_key, old_field_key, convertedSchema })
            //console.log("path:", path)
            console.log("stuff:", newConvertedSchema)
            // update enum
            if (["string", "integer", "number"].includes(tempUISchema["type"]) & enumChecked) {
                let newList = enumList

                // use if else statements instead of switch case statements for this case
                if (tempUISchema["type"] === "string") {
                    if (Array.isArray(newList)) {
                        set(newConvertedSchema, path + ".enumerate", newList)
                    } else {
                        newList = newList.replace(/\s*,\s*/g, ",")
                        let parsed = newList.split(",").map(function (item) {
                            return item.toString();
                        })
                        set(newConvertedSchema, path + ".enumerate", parsed.filter(x => x.toString() !== "NaN"))
                        //console.log("stuff:", newConvertedSchema)
                    }
                } else if (tempUISchema["type"] === "number") {
                    if (Array.isArray(newList)) {
                        let parsed = newList.map(function (item) {
                            return parseFloat(item, 10);
                        })
                        set(newConvertedSchema, path + ".enumerate", parsed.filter(x => x.toString() !== "NaN"))
                    } else {
                        newList = newList.replace(/\s*,\s*/g, ",")
                        let parsed = newList.split(",").map(function (item) {
                            return parseFloat(item, 10);
                        })
                        set(newConvertedSchema, path + ".enumerate", parsed.filter(x => x.toString() !== "NaN"))
                    }
                } else if (tempUISchema["type"] === "integer") {
                    if (Array.isArray(newList)) {
                        let parsed = newList.map(function (item) {
                            return parseInt(item, 10);
                        })
                        set(newConvertedSchema, path + ".enumerate", parsed.filter(x => x.toString() !== "NaN"))
                    } else {
                        newList = newList.replace(/\s*,\s*/g, ",")
                        let parsed = newList.split(",").map(function (item) {
                            return parseInt(item, 10);
                        })
                        set(newConvertedSchema, path + ".enumerate", parsed.filter(x => x.toString() !== "NaN"))
                    }
                }
            }

            //let sorted = convertedSchemaPropertiesSort(JSON.parse(JSON.stringify(newConvertedSchema["properties"])))
            //console.log(sorted)
            //newConvertedSchema["properties"] = sorted

            // delete the file if it's not fileupload and if the file exists
            if (UISchema["type"] === "fileupload (string)") {
                if (UISchema["value"] !== undefined) {
                    if (typeof UISchema["value"] === "string") {
                        if (UISchema["value"].includes("fileupload:") && UISchema["value"].split(";").length === 3) {
                            let fileIndex = getFileIndex(loadedFiles, UISchema["value"])
                            handleRemoveFile(fileIndex)
                        }
                    }
                }
            }
            // delete all files if the new type is not object
            // remove the file in loadedFiles
            if (UISchema["type"] === "object" && tempUISchema["type"] !== "object") {
                let cSchema = JSON.parse(JSON.stringify(convertedSchema))
                set(cSchema, path + ".properties", UISchema["properties"])
                let metmet = getValueInSchemaFullPath(cSchema, path + ".properties")
                const fileMetadata = getAllFileMetadata(metmet, [])
                if (fileMetadata.length > 0) {
                    for (let i = 0; i < fileMetadata.length; i++) {
                        const fileIndex = getFileIndex(loadedFiles, fileMetadata[i])
                        handleRemoveFile(fileIndex)
                    }
                }
            }
            // delete all files if the new type is not array
            if (UISchema["type"] === "array" && tempUISchema["type"] !== "array") {
                // remove the file in loadedFiles
                const fileMetadata = getValue(convertedSchema, path + `.value`)
                console.log("fileMetadata:", fileMetadata)
                if (fileMetadata !== undefined) {
                    let keywords = []
                    if (Array.isArray(fileMetadata)) {
                        if (fileMetadata.length > 0) {
                            for (let i = 0; i < fileMetadata.length; i++) {
                                if (typeof fileMetadata[i] === "object") {
                                    Object.keys(fileMetadata[i]).forEach((key) => {
                                        if (typeof fileMetadata[i][key] === "string") {
                                            if (fileMetadata[i][key].includes("fileupload:") && fileMetadata[i][key].split(";").length === 3) {
                                                keywords.push(fileMetadata[i][key])
                                            }
                                        }
                                    })
                                }
                            }
                        }
                    }
                    if (keywords.length > 0) {
                        for (let i = 0; i < keywords.length; i++) {
                            const fileIndex = getFileIndex(loadedFiles, keywords[i])
                            handleRemoveFile(fileIndex)
                        }
                    }
                }
                // remove the value in general
                let temporary =  getValue(convertedSchema, path)
                delete temporary["value"]
                set(newConvertedSchema, path, temporary)
            }
            // update main component
            updateParent(newConvertedSchema)
            setOpenDialog(false)

            //* update form data if fieldkey change
            // update pathFormData with new fieldkey
            updateFormDataId(old_field_key, fieldkey, pathFormData, defaultValue)
        }
    }

    // change descriptor value
    const handleChangeUISchema = (event, keyword) => {
        if (itemSchemaEdit && keyword === "type") {
            alert("You must save the array item schema edit first.")
            return
        } else {
        switch (keyword) {
            case 'type':
                // change default value to empty string
                setDefValue("")
                // special treatment for array
                if (event.target.value === "array") {
                    if (UISchema["type"] !== "array") {
                        setItemSchemaData(JSON.stringify({ "type": "string" }, null, 2))
                    }
                }
                return setSelectedType(event.target.value)
            case 'title':
                return setTitle(event.target.value)
            case 'description':
                return setDescription(event.target.value)
            case 'fieldKey':
                return setFieldKey(event.target.value.replace(/ /g, "_"))
            case 'defaultValue':
                let newValue = event.target.value
                if (selectedType === "number") {
                    if (event.target.value.at(-1) === '.') {
                        newValue = newValue.replace(/ /g, '')
                    } else {
                        newValue = newValue.replace(/(?!^-)[^0-9.]/g, "").replace(/(\..*)\./g, '$1')
                        newValue = newValue.replace(/ /g, '')
                        if (newValue.toString().length - event.target.value.length !== 0) {
                            alert("Invalid input type. This field only accepts input of a number type.")
                            newValue = parseFloat(newValue)
                        }
                        newValue = parseFloat(newValue)
                        if (!isFinite(newValue)){
                            newValue = ""
                        }
                    }
                }
                if (selectedType === "integer") {
                    newValue = newValue.replace(/(?!^-)[^0-9]/g, "")
                    newValue = newValue.replace(/ /g, '')
                    if (newValue.toString().length - event.target.value.length !== 0) {
                        alert("Invalid input type. This field only accepts input of an integer type.")
                        newValue = parseInt(newValue)
                    }
                    newValue = parseInt(newValue)
                    if (!isFinite(newValue)) {
                        newValue = ""
                    }
                }
                console.log(newValue)
                return setDefValue(newValue)
            case '$id':
                //handleCheckIDexistence(event.target.value)
                return setFieldUri(event.target.value)
            case 'id':
                //handleCheckIDexistence(event.target.value)
                return setFieldUri(event.target.value)
            case 'itemType':
                return setArrayItemType(event.target.value)
            default:
                return null;
        }
        }
    }


    // handleChange MinMax array item
    const handleMinMaxArrayItem = (event, field) => {
        let value = [...arrayMinMaxItem]
        switch (field) {
            case 'max':
                value[1] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                value[1] = (value[1] === 0 ? "None" : value[1])
                //console.log(value)
                return setArrayMinMaxItem(value);
            case 'min':
                value[0] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                return setArrayMinMaxItem(value);
            default:
                return null;
        }
    }

    const handleMinMaxArrayItemOnBlur = (event, keyword) => {
        let value = [...arrayMinMaxItem]

        // early exit
        if (value[0] === "None" && value[1] === "None") {
            console.log("Doing nothing because the inputs have not changed.")
            return
        }
        switch (keyword) {
            case 'min':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setArrayMinMaxHelperText(<div style={{ color: "#f44336" }}>minItems value cannot be greater or equal than maxItems value. minItems value was changed to 'None'.</div>)
                    value[0] = "None"
                    return setArrayMinMaxItem(value);
                } else {
                    setArrayMinMaxHelperText("Set the minimum and maximum values of the items allowed for this array field.")
                    return setArrayMinMaxItem(value);
                }
            case 'max':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setArrayMinMaxHelperText(<div style={{ color: "#f44336" }}>minItems value cannot be greater or equal than maxItems value. maxItems value was changed to 'None'.</div>)
                    value[1] = "None"
                    return setArrayMinMaxItem(value);
                } else {
                    setArrayMinMaxHelperText("Set the minimum and maximum values of the items allowed for this array field.")
                    return setArrayMinMaxItem(value);
                }
            default:
                return null;
        }
    }

    // handleChange MinMax array item
    const handleMinMaxValue = (event, minMax) => {
        let value = [...numberMinMaxValue]
        switch (minMax) {
            case 'max-integer':
                if (event.target.value.replace("None", "") === "-") {
                    console.log(event.target.value)
                    value[1] = event.target.value.replace("None", "")
                    return setNumberMinMaxValue(value)
                } else {
                    value[1] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                    return setNumberMinMaxValue(value);
                }
            case 'min-integer':
                if (event.target.value.replace("None", "") === "-") {
                    console.log(event.target.value)
                    value[0] = event.target.value.replace("None", "")
                    return setNumberMinMaxValue(value)
                } else {
                    value[0] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                    return setNumberMinMaxValue(value);
                }
            // for now number is the same as integer
            case 'max-number':
                if (event.target.value.replace("None", "") === "-") {
                    console.log(event.target.value)
                    value[1] = event.target.value.replace("None", "")
                    return setNumberMinMaxValue(value)
                } else {
                    value[1] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                    return setNumberMinMaxValue(value);
                }
            case 'min-number':
                if (event.target.value.replace("None", "") === "-") {
                    console.log(event.target.value)
                    value[0] = event.target.value.replace("None", "")
                    return setNumberMinMaxValue(value)
                } else {
                    value[0] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                    return setNumberMinMaxValue(value);
                }
            default:
                return null;
        }
    }

    const handleMinMaxValueOnBlur = (event, minMax) => {
        let value = [...numberMinMaxValue]

        // early exit
        if (value[0] === "None" && value[1] === "None") {
            console.log("Doing nothing because the inputs have not changed.")
            return
        }

        switch (minMax) {
            case 'min-integer':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setNumberMinMaxValueHelpertext(<div style={{ color: "#f44336" }}>Min. value cannot be greater or equal than max. value. Min. value was changed to 'None'.</div>)
                    value[0] = "None"
                    return setNumberMinMaxValue(value);
                } else {
                    setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")
                    return setNumberMinMaxValue(value);
                }
            case 'min-number':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setNumberMinMaxValueHelpertext(<div style={{ color: "#f44336" }}>Min. value cannot be greater or equal than max. value. Min. value was changed to 'None'.</div>)
                    value[0] = "None"
                    return setNumberMinMaxValue(value);
                } else if (value.includes("None")) {
                    return setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")
                }
                else {
                    setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")
                    return setNumberMinMaxValue(value);
                }
            case 'max-integer':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setNumberMinMaxValueHelpertext(<div style={{ color: "#f44336" }}>Min. value cannot be greater or equal than max. value.  Max. value was changed to 'None'.</div>)
                    value[1] = "None"
                    return setNumberMinMaxValue(value);
                } else {
                    setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")
                    return setNumberMinMaxValue(value);
                }
            case 'max-number':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setNumberMinMaxValueHelpertext(<div style={{ color: "#f44336" }}>Min. value cannot be greater or equal than max. value. Max. value was changed to 'None'.</div>)
                    value[1] = "None"
                    return setNumberMinMaxValue(value);
                } else if (value.includes("None")) {
                    return setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")
                }
                else {
                    setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")
                    return setNumberMinMaxValue(value);
                }
            default:
                return null;
        }
    }

    // handleChange MinMax length for string
    const handleMinMaxCharLength = (event, field) => {
        let value = [...charMinMaxLengthValue]
        switch (field) {
            case 'maxLength':
                value[1] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                value[1] = (value[1] === 0 ? "None" : value[1])
                //console.log(value)
                return setCharMinMaxLengthValue(value);
            case 'minLength':
                value[0] = (Number.isNaN(parseInt(event.target.value.replace("None", ""))) ? "None" : parseInt(event.target.value.replace("None", "")))
                return setCharMinMaxLengthValue(value);
            default:
                return null;
        }
    }
    const handleMinMaxCharLengthOnBlur = (event, keyword) => {
        let value = [...charMinMaxLengthValue]

        // early exit
        if (value[0] === "None" && value[1] === "None") {
            console.log("Doing nothing because the inputs have not changed.")
            return
        }

        switch (keyword) {
            case 'minLength':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setCharMinMaxHelperText(<div style={{ color: "#f44336" }}>minLength value cannot be greater or equal than maxLength value.</div>)
                    value[0] = "None"
                    return setCharMinMaxLengthValue(value);
                } else {
                    setCharMinMaxHelperText("Set the minimum and maximum length allowed for this string input.")
                    return setCharMinMaxLengthValue(value);
                }
            case 'maxLength':
                if (value[0] >= value[1]) {
                    console.log("min value cannot be greater than max value")
                    setCharMinMaxHelperText(<div style={{ color: "#f44336" }}>minLength value cannot be greater or equal than maxLength value.</div>)
                    value[1] = "None"
                    return setCharMinMaxLengthValue(value);
                } else {
                    setCharMinMaxHelperText("Set the minimum and maximum length allowed for this string input.")
                    return setCharMinMaxLengthValue(value);
                }
            default:
                return null;
        }
    }

    // cancel editing
    const handleCancelEdit = () => {
        if (editOrAdd !== undefined && editOrAdd === "add") {
            setOpenDialog(false)
        }
        else {
            tempUISchema = JSON.parse(JSON.stringify(UISchema))
            setOpenDialog(false)
            setEnumList(field_enumerate)
            setDefValue(defaultValue)
            setSelectedType(UISchema["type"])
        }
    }

    // show / hide item schema textfield
    const handleShowItemSchemaText = () => {
        setItemSchemaTFrow(!itemSchemaTFrow)
    }

    // Edit item schema manually
    const handleEditItemSchema = () => {
        if (itemSchemaEdit) {
            // validate and save the inputed schema
            let schemaIsValid = handleValidateItemSchema()
            if (schemaIsValid) {
                setArrayItemType(JSON.parse(itemSchemaData)["type"])
                let tempID = JSON.parse(itemSchemaData)["id"]
                let tempID2 = JSON.parse(itemSchemaData)["$id"]
                let ID = undefined
                if (tempID !== undefined){
                    ID = tempID
                }
                if (tempID2 !== undefined){
                    ID = tempID2
                }

                //alert(ID + " | " + UISchema["items"]["$id"] + " | " + ID + " | " + UISchema["items"]["id"])
                if (ID == undefined) {
                    setItemSchemaEdit(false)
                } else if (ID === UISchema["items"]["$id"] || ID === UISchema["items"]["id"]) {
                    //alert(ID + " | " + UISchema["items"]["$id"] + " | " + ID + " | " + UISchema["items"]["id"])
                    setItemSchemaEdit(false)
                } else if (ID !== undefined) {
                    if (handleCheckIDexistence(ID)){
                        alert("A field element with the same ID already exists. Either change the ID or remove it.")
                        setItemSchemaEdit(true)
                        setItemSchemaTFrow(true)
                    } else {
                        setItemSchemaEdit(false)
                    }
                }
            }
        } else {
            setItemSchemaEdit(true)
            setItemSchemaTFrow(true)
        }
    }

    // handle change itemSchemaData
    const handleChangeItemSchemaTextField = (event) =>{
        //console.log(event.target.value)
        setItemSchemaData(event.target.value)
    }

    const handleChangeDefaultItemSchema = (itemType) =>{
        if (UISchema["items"] !== "None") {
            if (UISchema["items"]["type"] !== itemType){
                switch (itemType) {
                    case 'integer':
                        setItemSchemaData(JSON.stringify({ "type": "integer" }, null, 2))
                        return
                    case 'number':
                        setItemSchemaData(JSON.stringify({ "type": "number" }, null, 2))
                        return
                    case 'string':
                        setItemSchemaData(JSON.stringify({ "type": "string" }, null, 2))
                        return
                    case 'object':
                        setItemSchemaEdit(true)
                        setItemSchemaTFrow(true)
                        setItemSchemaData("Browse or copy your item schema here then save.")
                        return
                }
            } else {
                setItemSchemaData(JSON.stringify(UISchema["items"], null, 2))
            }
        } else {
            if (itemType !== "object") {
                setItemSchemaData(JSON.stringify({ "type": itemType }, null,2))
            } else {
                setItemSchemaEdit(true)
                setItemSchemaTFrow(true)
                setItemSchemaData("Browse or copy your item schema here then save.")
            }
        }
    }

    // handle validate on click for Edit item schema 
    const handleValidateItemSchema = () => {
        try {
            // first check if the format is correct
            let parsed = JSON.parse(itemSchemaData)
            // then check if the schema is managable
            /*
            if (parsed["type"] !== arrayItemDataType) {
                alert("The inputted schema data type and selected item data type don't match.")
                return false
            }*/
            if (parsed["type"] === "object") {
                if (parsed["properties"] === undefined){
                    alert("Object type schema does not have properties.")
                    return false
                }
                if (typeof parsed["properties"] !== 'object'){
                    alert("Object type properties is not of object type")
                    return false
                }

                let tooDeep = false
                Object.keys(parsed["properties"]).forEach(key =>{
                    if (parsed["properties"][key]["type"] === "object"){
                        alert("Schema is too deep. At the moment, this feature only supports a flat schema.")
                        tooDeep = true
                    }
                })

                if (tooDeep){
                    return false
                } else {
                    return true
                }
                                
            } else {
                return true
            }
        } catch(err) {
            alert("Invalid item schema.")
            return false
        }
        
    }

    // handle change required check box
    const handleCheckBoxOnChange = () => {
        setRequiredChecked(prev => !prev)
    }

    // handle change required check box
    const handleEnumBoxOnChange = () => {
        setEnumChecked(prev => !prev)
    }

    // handle change uniqueItems check box
    const handleUniqueItemsCheckBoxOnChange = () => {
        setArrayUniqueItems(prev => !prev)
    }

    const handleExclusiveMinMax = (event, minMax) => {
        let value = [...numberExclusiveMinMax]
        const parsed = parseFloat(event.target.value.replace("None", ""))
        if (minMax.startsWith("min")) {
            value[0] = Number.isNaN(parsed) ? "None" : parsed
        } else {
            value[1] = Number.isNaN(parsed) ? "None" : parsed
        }
        setNumberExclusiveMinMax(value)
    }

    const handleMultipleOf = (event) => {
        const val = parseFloat(event.target.value.replace("None", ""))
        setMultipleOfValue(Number.isNaN(val) ? "None" : val)
    }

    // tuple handlers
    const handleAddTupleItem = () => {
        setTupleItems(prev => [...prev, { type: "string", title: "", description: "" }])
    }
    const handleRemoveTupleItem = (index) => {
        setTupleItems(prev => prev.filter((_, i) => i !== index))
    }
    const handleChangeTupleItem = (index, field, value) => {
        setTupleItems(prev => {
            const copy = [...prev]
            copy[index] = { ...copy[index], [field]: value }
            return copy
        })
    }
    const handleToggleTuple = () => {
        const next = !isTuple
        setIsTuple(next)
        if (next && tupleItems.length === 0) {
            setTupleItems([{ type: "string", title: "", description: "" }])
        }
    }

    // function to check if the file accepted is of json format and json schema valid
    const checkSubSchemaValidity = (schemaFile) => {
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
                    console.log("Converted Schema:", convertedSchema)
                    setConvertedSubSchema(convertedSchema)
                    // update states
                    setSubSchemaValidity(true);
                    setSubSchemaFilename(schemaFile[0]["name"])
                    console.log("Subschema is valid")

                    const copiedObj = JSON.parse(JSON.stringify(obj))

                    //alert(activeSubSchemaButton)
                    if (activeSubSchemaButton === "subschema") {
                        Object.keys(copiedObj).forEach(key => {
                            if (key === "id") {
                                //return setSelectedType(event.target.value)
                                //setFieldUri(obj[key])
                                //alert(key)
                                //let event = {target: {value: copiedObj[key]}}
                                //handleChangeUISchema(event, key)
                                setFieldUri(copiedObj[key])
                            }
                            if (key === "$id") {
                                //let event = {target: {value: copiedObj[key]}}
                                //handleChangeUISchema(event, key)
                                setFieldUri(copiedObj[key])
                            }
                            if (key === "title") {
                                //setTitle(obj[key])
                                let event = { target: { value: copiedObj[key] } }
                                handleChangeUISchema(event, key)
                            }
                            if (key === "description") {
                                //setDescription(obj[key])
                                let event = { target: { value: copiedObj[key] } }
                                handleChangeUISchema(event, key)
                            }
                        })
                    }

                } catch (error) {
                    console.log(error);
                    alert(`${schemaFile[0]["name"]} is invalid!`)
                    // update states
                    setSubSchemaValidity(false);
                    setSubSchemaFilename(schemaFile[0]["name"])
                }
            };
            reader.readAsText(schemaFile[0]);
        } else {
            // update states
            alert(`${schemaFile[0]["name"]} is invalid!`)
            setSubSchemaValidity(false);
            setSubSchemaFilename(schemaFile[0]["name"])
        }
    };


    // browse or drag&drop schema file
    const onDrop = useCallback(
        (acceptedFile) => {
            // process the schema, validation etc
            if (selectedType !== "array") {
                checkSubSchemaValidity(acceptedFile);
            }
            else {
                if (acceptedFile[0]["type"] !== "application/json") {
                    alert("Only json files please.")
                    return
                }
                // read the schema and send it to itemSchemaData
                console.log("browse item schema for array type")
                const reader = new FileReader();
                reader.onabort = () => console.log("file reading was aborted");
                reader.onerror = () => console.log("file reading has failed");
                reader.onload = () => {
                    const binaryStr = reader.result;
                    const obj = JSON.parse(binaryStr);
                    let itemSchema = JSON.stringify(obj, null, 2);
                    setItemSchemaData(itemSchema)
                    setItemSchemaEdit(true)
                    setItemSchemaTFrow(true)
                }
                reader.readAsText(acceptedFile[0]);
            }
            // store schema file in the state
            // update states
            // setRenderReady(false);
            // setDisable(true);
            // setCreateScratchMode(false);
            // setJsonData({});
            // setSelectedSchemaName("");
        },
        [activeSubSchemaButton, selectedType]
    );
    // for upload subschema
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: false,
    });

    return (
        <>
            {notImplemented ?
                <Dialog
                    open={openDialog}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                            {editOrAdd === "add" ? <AddIcon fontSize="large" color="primary" style={{ alignSelf: "center" }} /> : <EditIcon fontSize="large" color="primary" style={{ alignSelf: "center" }} />}
                            <div style={{ width: "100%", alignSelf: "center" }}>
                                {editOrAdd === "add" ? `Add element in "${field_label}"` : `Edit "${tempUISchema["title"]}"`}
                            </div>
                            <IconButton onClick={() => handleCancelEdit()}><CloseIcon fontSize="large" color="secondary" /></IconButton>
                        </div>
                    </DialogTitle>
                    <Divider />
                    <DialogContent>
                        We are sorry! Editing feature for the "{UISchema["type"]}" type/keyword is not yet implemented.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => handleCancelEdit()} color="secondary">
                            Cancel
                        </Button>
                        <Button disabled onClick={() => handleUpdateSchemaOnClick()} color="primary" autoFocus>
                            {editOrAdd === "add" ? "Add" : "Save"}
                        </Button>
                    </DialogActions>
                </Dialog>
                :
                <Dialog
                    open={openDialog}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                            {editOrAdd === "add" ? <AddIcon fontSize="large" color="primary" style={{ alignSelf: "center" }} /> : <EditIcon fontSize="large" color="primary" style={{ alignSelf: "center" }} />}
                            <div style={{ width: "100%", alignSelf: "center" }}>
                                {editOrAdd === "add" ? `Add element in "${field_label}"` : `Edit "${tempUISchema["title"]}"`}
                            </div>
                            <IconButton onClick={() => handleCancelEdit()}><CloseIcon fontSize="large" color="secondary" /></IconButton>
                        </div>
                    </DialogTitle>
                    <Divider />
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description" component="span">
                            <div>
                                <FormControl component="widget-type">
                                    <FormLabel style={{ color: "#01579b" }} component="legend">Basic Descriptors:</FormLabel>
                                    <TextField margin="normal" required onChange={event => handleChangeUISchema(event, "fieldKey")} style={{ marginTop: "20px" }} value={fieldkey} variant="outlined" fullWidth={true} label={"Field Keyword"} helperText='A unique json keyword for this field. Usually short and has no spaces (use "_" instead). Spaces are replaced automatically with "_" upon saving.' />
                                    <TextField margin="normal" onChange={event => handleChangeUISchema(event, "$id")} style={{ marginTop: "10px" }} value={fieldUri} variant="outlined" fullWidth={true} label={"Field ID/URI"} helperText='ID or URI for this field if available.' />
                                    <TextField margin="normal" onChange={event => handleChangeUISchema(event, "title")} style={{ marginTop: "10px" }} value={title} variant="outlined" fullWidth={true} label={"Field Title"} helperText='Label or title of the field. For a field that requires a unit, the unit can be placed within a square bracket, e,g., "Chamber Pressure [Pa]".' />
                                    <TextField margin="normal" onChange={event => handleChangeUISchema(event, "description")} style={{ marginTop: "10px" }} value={description} variant="outlined" fullWidth={true} label={"Field Description"} multiline rows={3} helperText='A detailed description of the field, how the input should be formated, etc.' />
                                    <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
                                        <FormControl component="validation-related">
                                            <FormLabel style={{ color: "#01579b" }} component="legend">Validation Related:</FormLabel>
                                        </FormControl>
                                    </div>
                                    <TextField
                                        margin="normal"
                                        helperText='Data type of the field input.'
                                        onChange={event => handleChangeUISchema(event, "type")}
                                        style={{ marginTop: "10px" }}
                                        //defaultValue={tempUISchema["type"]}
                                        select
                                        fullWidth={true}
                                        id={field_key}
                                        label={"Field Data Type"}
                                        variant="outlined"
                                        value={selectedType}
                                        SelectProps={{
                                            native: true,
                                        }}
                                    >
                                        {datatypes.map((content, index) => (
                                            <option key={index} value={content}>
                                                {content}
                                            </option>
                                        ))}
                                    </TextField>
                                    {["number", "integer"].includes(selectedType) ?
                                        <>
                                            <div style={{ display: "flex" }}>
                                                <TextField onFocus={() => setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")} value={numberMinMaxValue[0]} onBlur={(event) => { handleMinMaxValueOnBlur(event, "min-" + selectedType) }} onChange={event => handleMinMaxValue(event, "min-" + selectedType)} margin="normal" fullWidth variant='outlined' label="Minimum Value" />
                                                <div style={{ paddingLeft: "10px" }}></div>
                                                <TextField onFocus={() => setNumberMinMaxValueHelpertext("Set the minimum and maximum values of this field.")} value={numberMinMaxValue[1]} onBlur={(event) => { handleMinMaxValueOnBlur(event, "max-" + selectedType) }} onChange={event => handleMinMaxValue(event, "max-" + selectedType)} margin="normal" fullWidth variant='outlined' label="Maximum Value" />
                                            </div>
                                            <div style={{ color: "gray", fontSize: "12px", paddingLeft: "11px", paddingRight: "11px" }}>{numberMinMaxValueHelperText}</div>
                                            <div style={{ display: "flex" }}>
                                                <TextField value={numberExclusiveMinMax[0]} onChange={event => handleExclusiveMinMax(event, "min")} margin="normal" fullWidth variant='outlined' label="Exclusive Minimum" helperText="Strict lower bound (value must be strictly greater than this)." />
                                                <div style={{ paddingLeft: "10px" }}></div>
                                                <TextField value={numberExclusiveMinMax[1]} onChange={event => handleExclusiveMinMax(event, "max")} margin="normal" fullWidth variant='outlined' label="Exclusive Maximum" helperText="Strict upper bound (value must be strictly less than this)." />
                                            </div>
                                            <TextField value={multipleOfValue} onChange={event => handleMultipleOf(event)} margin="normal" fullWidth variant='outlined' label="Multiple Of" helperText="Value must be a multiple of this number. Leave as None to disable." />
                                        </>
                                        : null}
                                    {selectedType === "string" ?
                                        <>
                                            <div style={{ display: "flex" }}>
                                                <TextField onFocus={() => setCharMinMaxHelperText("Set the minimum and maximum length allowed for this string input.")} value={charMinMaxLengthValue[0]} onBlur={(event) => { handleMinMaxCharLengthOnBlur(event, "minLength") }} onChange={event => handleMinMaxCharLength(event, "minLength")} margin="normal" fullWidth variant='outlined' label="Minimum Character Length" />
                                                <div style={{ paddingLeft: "10px" }}></div>
                                                <TextField onFocus={() => setCharMinMaxHelperText("Set the minimum and maximum length allowed for this string input.")} value={charMinMaxLengthValue[1]} onBlur={(event) => { handleMinMaxCharLengthOnBlur(event, "maxLength") }} onChange={event => handleMinMaxCharLength(event, "maxLength")} margin="normal" fullWidth variant='outlined' label="Maximum Character Length" />
                                            </div>
                                            <div style={{ color: "gray", fontSize: "12px", paddingLeft: "11px", paddingRight: "11px" }}>{charMinMaxHelperText}</div>
                                            <TextField value={patternValue} onChange={event => setPatternValue(event.target.value)} margin="normal" fullWidth variant='outlined' label="Pattern (regex)" helperText="A regular expression the string value must match. E.g., ^[A-Za-z]+$" />
                                            <TextField
                                                value={formatValue}
                                                onChange={event => setFormatValue(event.target.value)}
                                                select
                                                fullWidth
                                                label="Format"
                                                margin="normal"
                                                variant='outlined'
                                                helperText="Semantic format annotation for this string field."
                                                SelectProps={{ native: true }}
                                            >
                                                {["", "date-time", "date", "time", "email", "hostname", "ipv4", "ipv6", "uri", "uri-reference", "uuid", "json-pointer", "regex"].map(f => (
                                                    <option key={f} value={f}>{f || "— none —"}</option>
                                                ))}
                                            </TextField>
                                        </>
                                        : null}
                                    {["string", "integer", "number"].includes(selectedType) ?
                                        <>
                                            <FormControlLabel control={<Checkbox onChange={() => handleEnumBoxOnChange()} checked={enumChecked} />} label="Enumerated. Provide a list of possible inputs for this field." />
                                            <div style={{ marginLeft: "32px", marginTop: "0px", marginBottom: "10px" }}>
                                                {enumChecked ? <TextField defaultValue={enumList !== undefined ? enumList : ""} onChange={handleOnChangeListField} variant="outlined" fullWidth={true} label="Enumerate List" multiline rows={2} helperText="A list of inputs separated by commas, e,g.: item 1, item 2, item 3. Make sure that the item data type matches the field input data type. Invalid items will be not saved." /> : <Divider />}
                                            </div>
                                        </> : null}
                                </FormControl>
                                <div style={{ paddingBottom: "10px" }}>
                                    <FormGroup>
                                        {selectedType === "array" ?
                                            <>
                                                <FormControlLabel
                                                    control={<Checkbox onChange={handleToggleTuple} checked={isTuple} />}
                                                    label="Tuple array — each position has a fixed type"
                                                />
                                                {isTuple ? (
                                                    <div style={{ marginLeft: "12px", marginBottom: "8px" }}>
                                                        <div style={{ color: "gray", fontSize: "11px", marginBottom: "8px" }}>
                                                            Define each positional item. The keyword used (<code>items</code> vs <code>prefixItems</code>) is chosen automatically based on the loaded schema dialect.
                                                        </div>
                                                        {tupleItems.map((item, idx) => (
                                                            <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                                                                <div style={{ minWidth: "72px", color: "#555", fontSize: "12px", paddingTop: "4px" }}>Position {idx + 1}</div>
                                                                <TextField
                                                                    size="small"
                                                                    select
                                                                    label="Type"
                                                                    value={item.type}
                                                                    onChange={e => handleChangeTupleItem(idx, "type", e.target.value)}
                                                                    variant="outlined"
                                                                    style={{ minWidth: "110px" }}
                                                                    SelectProps={{ native: true }}
                                                                >
                                                                    {["string", "number", "integer", "boolean"].map(t => (
                                                                        <option key={t} value={t}>{t}</option>
                                                                    ))}
                                                                </TextField>
                                                                <TextField
                                                                    size="small"
                                                                    label="Title"
                                                                    value={item.title}
                                                                    onChange={e => handleChangeTupleItem(idx, "title", e.target.value)}
                                                                    variant="outlined"
                                                                    fullWidth
                                                                />
                                                                <IconButton size="small" onClick={() => handleRemoveTupleItem(idx)} style={{ flexShrink: 0 }}>
                                                                    <DeleteIcon fontSize="small" color="secondary" />
                                                                </IconButton>
                                                            </div>
                                                        ))}
                                                        <Button size="small" variant="outlined" color="primary" onClick={handleAddTupleItem} style={{ marginTop: "4px" }}>
                                                            <AddIcon fontSize="small" style={{ marginRight: "4px" }} /> Add Position
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex" }}>
                                                        <div style={{ backgroundColor: "#3f51b5", paddingRight: "2px" }}></div>
                                                        <div style={{ height: "auto", width: "100%", paddingLeft: "5px" }}>
                                                            <TextField
                                                                size='small'
                                                                margin="normal"
                                                                helperText={'Data type of the array items.'}
                                                                onChange={event => { handleChangeUISchema(event, "itemType"); setArrayItemDataType(event.target.value); handleChangeDefaultItemSchema(event.target.value)}}
                                                                style={{ marginTop: "10px" }}
                                                                defaultValue={tempUISchema["items"] !== undefined && !Array.isArray(tempUISchema["items"]) ? tempUISchema["items"]["type"] : "string"}
                                                                select
                                                                fullWidth={true}
                                                                id={field_key}
                                                                label={"Item Data Type"}
                                                                variant="outlined"
                                                                SelectProps={{ native: true }}
                                                            >
                                                                {arrayItemTypeList.map((content, index) => (
                                                                    <option key={index} value={content}>{content}</option>
                                                                ))}
                                                            </TextField>
                                                            {itemSchemaTFrow ? <TextField fullWidth={true} disabled={!itemSchemaEdit} margin="normal" label={"Item Schema"} onChange={(event) => handleChangeItemSchemaTextField(event)} variant="filled" multiline rows={itemSchemaData.split(/\r?\n|\r|\n/g).length > 10 ? 20 : 2} InputProps={{ className: classes.input }}
                                                                value={itemSchemaData}> </TextField> : null}
                                                            <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
                                                                <Button fullWidth={true} size="small" color='primary' margin="normal" variant="outlined" style={{ marginRight: "5px", fontSize: "9pt" }} {...getRootProps()}> <input {...getInputProps()} />Browse Item Schema</Button>
                                                                <Button fullWidth={true} size="small" color={!itemSchemaEdit ? 'primary':'secondary'} margin="normal" variant="outlined" style={{ fontSize: "9pt" }} onClick={()=> handleEditItemSchema()}> {itemSchemaEdit ? "Save" : "Edit"} Item Schema</Button>
                                                                <Button fullWidth={true} size="small" color='primary' margin="normal" variant="outlined" style={{ marginLeft: "5px", fontSize: "9pt" }} onClick={() => handleShowItemSchemaText()}> {!itemSchemaTFrow ? "Show" : "Hide" } Item Schema </Button>
                                                            </div>
                                                            <div style={{ height:"10px", fontSize: "9pt", paddingLeft: "13px", paddingTop: "5px"}}>This is where you edit the item schema for this array type.</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div style={{ display: "flex" }}>
                                                    <TextField value={arrayMinMaxItem[0]} onChange={event => handleMinMaxArrayItem(event, "min")} onBlur={event => { handleMinMaxArrayItemOnBlur(event, "min") }} margin="normal" fullWidth variant='outlined' label="Min. Array Items" />
                                                    <div style={{ paddingLeft: "10px" }}></div>
                                                    <TextField value={arrayMinMaxItem[1]} onChange={event => handleMinMaxArrayItem(event, "max")} onBlur={event => { handleMinMaxArrayItemOnBlur(event, "max") }} margin="normal" fullWidth variant='outlined' label="Max. Array items" />
                                                </div>
                                                <div style={{ color: "gray", fontSize: "12px", paddingLeft: "11px", paddingRight: "11px", paddingBottom: "10px" }}>{arrayMinMaxHelperText}</div>
                                                <FormControlLabel control={<Checkbox onChange={() => handleUniqueItemsCheckBoxOnChange()} checked={arrayUniqueItems} />} label="Input items must be unique." />
                                                <FormControlLabel control={<Checkbox onChange={() => handleCheckBoxOnChange()} checked={requiredChecked} />} label="Required. Checked means the field must be filled." />
                                            </>
                                            : null}
                                        <div style={{ display: "flex" }}>
                                            <div style={{ backgroundColor: "#3f51b5", paddingRight: "2px" }}></div>
                                            <div style={{ height: "auto", width: "100%", paddingLeft: "5px" }}>
                                        {selectedType === "object" ? <>
                                            <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
                                                <div onClick={() => setActiveSubSchemaButton("subschema")} style={{ paddingRight: "5px", width: "100%" }}><Button fullWidth={true} size="small" color="primary" variant="outlined" {...getRootProps()}> <input {...getInputProps()} />Browse a subschema</Button></div>
                                                <Button fullWidth={true} size="small" color="primary" variant="outlined" {...getRootProps()}> <input {...getInputProps()} />Browse schema properties</Button>
                                            </div>
                                            {subSchemaValidity ? <div style={{ color: "green", fontSize: "9pt", paddingLeft: "13px", paddingTop: "5px", paddingBottom: "5px" }}>{subSchemaFilename} is valid.</div> : null}
                                            <div style={{ fontSize: "9pt", paddingLeft: "13px", paddingTop: "5px", paddingBottom: "5px" }}>Browse and add a subschema or schema properties for this object by clicking on the corresponding button above.</div>
                                        </> : null}
                                        </div>
                                        </div>
                                        {selectedType === "object" ? <FormControlLabel control={<Checkbox onChange={() => handleCheckBoxOnChange()} checked={requiredChecked} />} label="Required. Checked means the field must be filled." /> : null}
                                        {selectedType !== "object" & selectedType !== "array" & selectedType !== "boolean" ?
                                            <>
                                                <FormControlLabel control={<Checkbox onChange={() => handleCheckBoxOnChange()} checked={requiredChecked} />} label="Required. Checked means the field must be filled." />
                                                <div style={{ paddingTop: "15px", paddingBottom: "0px" }}>
                                                    <FormControl component="misc-keywords">
                                                        <FormLabel style={{ color: "#01579b" }} component="legend">Misc.:</FormLabel>
                                                    </FormControl>
                                                </div>
                                                {selectedType === "fileupload (string)" ? null : <TextField margin='normal' onChange={event => handleChangeUISchema(event, "defaultValue")} style={{ marginTop: "10px" }} value={defValue} variant="outlined" fullWidth={true} label={"Field Default Value"} helperText="Initial value of the field." />}
                                            </>
                                            : null}
                                        {selectedType === "boolean" ?
                                            <>
                                                <div style={{ paddingTop: "15px", paddingBottom: "0px" }}>
                                                    <FormControl component="misc-keywords">
                                                        <FormLabel style={{ color: "#01579b" }} component="legend">Misc.:</FormLabel>
                                                    </FormControl>
                                                </div>
                                                <TextField
                                                    margin='normal'
                                                    onChange={event => handleChangeUISchema(event, "defaultValue")}
                                                    style={{ marginTop: "10px" }}
                                                    defaultValue={defaultValue !== undefined ? defaultValue : ""}
                                                    select
                                                    fullWidth={true}
                                                    id={field_key}
                                                    label={"Boolean Field Default Value"}
                                                    variant="outlined"
                                                    SelectProps={{
                                                        native: true,
                                                    }}
                                                >
                                                    {["", "true", "false"].map((content, index) => (
                                                        <option key={index} value={content}>
                                                            {content}
                                                        </option>
                                                    ))}
                                                </TextField>
                                            </>
                                            : null}
                                    </FormGroup>
                                </div>
                            </div>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => handleCancelEdit()} color="secondary">
                            Cancel
                        </Button>
                        <Button onClick={() => handleUpdateSchemaOnClick()} color="primary" autoFocus>
                            {editOrAdd === "add" ? "Add" : "Save"}
                        </Button>
                    </DialogActions>
                </Dialog>}
        </>

    )
};

export default EditElement;