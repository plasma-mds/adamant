import React, { useState, useContext, useEffect, useCallback } from "react";
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { AccordionDetails } from '@material-ui/core';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from "@material-ui/icons/AddBox";
import DeleteIcon from "@material-ui/icons/Delete";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FormContext } from "../../FormContext";
import DragHandleIcon from "@material-ui/icons/DragIndicator";
import deleteKey from "../utils/deleteKey";
import EditElement from "../EditElement";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ArrayItemRenderer from "./ArrayItemRenderer";
import generateUniqueID from "../utils/generateUniqueID";
import { Tooltip } from "@material-ui/core";
import getValue from "../utils/getValue";
import set from "set-value";
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import { toast } from "react-toastify";
import getValueInSchemaFullPath from "../utils/getValueInSchemaFullPath";
import getFileIndex from "../utils/getFileIndex";
import { useDropzone } from "react-dropzone";

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    heading: {
        color: 'rgba(82, 94, 103, 1)',
        fontSize: theme.typography.pxToRem(25),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));

const Accordion = withStyles({
    root: {
        border: `1px solid rgba(232, 244, 253, 1)`,
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        boxShadow: "none",
        '&:before': {
            display: 'none',
        },
        '&$expanded': {
            margin: 'auto',
        },
    },
    expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: "rgba(232, 244, 253, 1)",
        borderBottom: '1px solid rgba(0, 0, 0, .0)',
        marginBottom: -1,
        minHeight: 56,
        '&$expanded': {
            minHeight: 56,
        },
    },
    content: {
        '&$expanded': {
            margin: '12px 0',
        },
    },
    expanded: {},
})(MuiAccordionSummary);

const ArrayType = ({ adamant_field_error, adamant_error_description, maxItems, minItems, uniqueItems, oSetDataInputItems, oDataInputItems, withinObject, withinArray, field_uri, value, pathFormData, path, pathSchema, field_required, field_key, field_index, edit, field_label, field_description, field_items, field_prefixItems }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [expand, setExpand] = useState(true);
    const { handleLoadedFiles, handleRemoveFile, loadedFiles, setLoadedFiles, updateParent, convertedSchema, handleDataDelete, handleConvertedDataInput, openDatasetSubmissionDialog } = useContext(FormContext);
    const [inputItems, setInputItems] = useState([]);
    const [dataInputItems, setDataInputItems] = useState([]);
    //const [descriptionText, setDescriptionText] = useState(field_description !== undefined ? field_description : "")
    const [descriptionText, setDescriptionText] = useState()
    const [inputError, setInputError] = useState(false)
    const [currentFiles, setCurrentFiles] = useState([])

    useEffect(()=>{
        if (field_items["type"] === "object") {
            setDataInputItems([{}])
        }

        if (value !== undefined) {
            if (value.length !== 0 && loadedFiles.length === 0){
                setLoadedFiles(Array(value.length))
            }
        }

    },[field_items, value])

    useEffect(() => {
        //console.log("currentFiles length:", currentFiles.length)
        if (currentFiles.length > 0) {
            // check if current array still has not reached maximum item
            if (maxItems !== undefined) {
                if (maxItems === (dataInputItems.length)) {
                    toast.warning(
                        `Can not add more item. Maximum number (${maxItems}) of items has been reached.`,
                        {
                            toastId: "maxNumberWarning"
                        }
                    );

                    return
                }
            }
            let stuff = currentFiles
            let acceptedFile = stuff.slice(-1)[0]
            // only works for resource schema first!!! THIS IS ONLY FOR TESTING
            let desiredValues = {}
            let inputItemIndex = undefined

            // check if the existing dataInputs already have metadata but not the files yet
            //console.log("dataInputItems:", dataInputItems)
            for (let i = 0; i < dataInputItems.length; i++) {
                if (acceptedFile["name"] === dataInputItems[i]["fileName"]) {
                    inputItemIndex = i
                }
            }
            // after that insert the files
            if (inputItemIndex !== undefined) {
                desiredValues = {
                    //"file": `fileupload:${acceptedFile["type"]};${acceptedFile["name"]};${acceptedFile["size"]}`,
                    "fileName": acceptedFile["name"],
                    "filetype": acceptedFile["type"]
                }
                let fileAlreadyExist = handleLoadedFiles(acceptedFile, value)
                //console.log("does the file already exist?", fileAlreadyExist)
                if (!fileAlreadyExist) {
                    handleAddArrayItem(desiredValues, inputItemIndex)
                    let val = currentFiles
                    val.pop()
                    setCurrentFiles(val)
                } else {
                    console.log("Not adding this array item.")
                    let arr = dataInputItems;
                    const items = Array.from(arr);
                    setDataInputItems(items)
                    let val = currentFiles
                    val.pop()
                    setCurrentFiles(val)
                    // insert the newly inserted data to convertedSchema
                    let newConvertedSchema = convertedSchema
                    set(newConvertedSchema, path + ".value", items)
                    updateParent(newConvertedSchema)
                }

            } else {
                //console.log("field items:", field_items)
                if (field_items["properties"]["file"] === undefined) {
                    desiredValues = {
                        "fileName": acceptedFile["name"],
                        "filetype": acceptedFile["type"]
                    }
                } else {
                    desiredValues = {
                        "file": `fileupload:${acceptedFile["type"]};${acceptedFile["name"]};${acceptedFile["size"]}`,
                        "fileName": acceptedFile["name"],
                        "filetype": acceptedFile["type"]
                    }
                }
                let fileAlreadyExist = handleLoadedFiles(acceptedFile, value)
                if (!fileAlreadyExist) {
                    handleAddArrayItem(desiredValues)
                    let val = currentFiles
                    val.pop()
                    setCurrentFiles(val)
                } else {
                    console.log("Not adding this array item.")
                    let arr = dataInputItems;
                    const items = Array.from(arr);
                    setDataInputItems(items)
                    let val = currentFiles
                    val.pop()
                    setCurrentFiles(val)
                    // insert the newly inserted data to convertedSchema
                    let newConvertedSchema = convertedSchema
                    set(newConvertedSchema, path + ".value", items)
                    updateParent(newConvertedSchema)
                }
            }
        } else {
            //setOpenReadingFilesDialogForArrayType(false)
        }
    }, [currentFiles, dataInputItems])

    // update description text state as soon as new field description is obtained
    // also create new items based on the uploaded files if applicable (only for resource array!)
    useEffect(() => {


        if (adamant_error_description !== undefined) {
            setDescriptionText(adamant_error_description)
        }
        else if (field_description !== undefined) {
            setDescriptionText(field_description)
        }
        else {
            setDescriptionText("")
        }

    }, [field_description])

    // for visual feedback on the field after validation
    useEffect(() => {
        setInputError(adamant_field_error !== undefined ? adamant_field_error : false)
        setDescriptionText(adamant_error_description !== undefined ? adamant_error_description : field_description !== undefined ? field_description : "")
    }, [adamant_error_description, adamant_field_error])

    // clean up empty strings in the paths
    path = path.split(".")
    path = path.filter(e => e)
    path = path.join(".")
    pathFormData = pathFormData.split(".")
    pathFormData = pathFormData.filter(e => e)
    pathFormData = pathFormData.join(".")

    // This is to expand or contract the accordion, because normally open is used 
    const expandOnChange = () => {
        const value = expand
        setExpand(!value)
    };

    // update this field input value everytime the value changes. E.g., when autofilling or first render of the field when defaultvalue exists
    /*
    useEffect(() => {
        if (field_prefixItems === undefined & field_items !== undefined) {
            if (value === undefined) {
                console.log("do nothing")
            } else {
                // use existing schema if items is not empty
                let newFieldItems = JSON.parse(JSON.stringify(field_items))
                newFieldItems["field_key"] = generateUniqueID();
                let arr = inputItems;
                const items = Array.from(arr);
                items.push(newFieldItems);
                setInputItems(items);

                if (["string", "number", "integer", "boolean"].includes(newFieldItems["type"])) {
                    // push a new item for the data
                    let arr2 = dataInputItems;
                    const items2 = Array.from(arr2);
                    items2.push("");
                    setDataInputItems(items2)

                    // conv. schema data
                    handleConvertedDataInput(value, path + ".value", "array")
                } else if (newFieldItems["type"] === "object") {
                    let arr2 = dataInputItems;
                    const items2 = Array.from(arr2);
                    items2.push({});
                    setDataInputItems(items2)

                    // conv. schema data
                    handleConvertedDataInput(value, path + ".value", "array")
                }
            }
        }
    }, [value])
    */
    useEffect(() => {
        if (withinArray !== undefined & withinArray === true) {
            value = oDataInputItems[field_index][field_key]

            if (value !== undefined) {
                if (field_prefixItems === undefined & field_items !== undefined) {
                    if (field_items["type"] !== "object") {
                        if (Object.keys(field_items).length === 0) {
                            // create field_items if items is empty
                            let items = [];
                            for (let i = 0; i < value.length; i++) {
                                field_items = { type: "string", field_key: `${generateUniqueID()}` }
                                items.push(field_items);
                            }
                            setInputItems(items);
                            setDataInputItems(value);
                        } else {
                            // use existing schema if items is not empty
                            let items = [];
                            for (let i = 0; i < value.length; i++) {
                                let newFieldItems = JSON.parse(JSON.stringify(field_items))
                                newFieldItems["field_key"] = generateUniqueID();
                                items.push(newFieldItems);
                            }
                            setInputItems(items);
                            setDataInputItems(value);
                        }
                    }
                }
            }
        }
        else {
            if (value !== undefined) {
                if (field_prefixItems === undefined & field_items !== undefined) {
                    if (field_items["type"] !== "object") {
                        if (Object.keys(field_items).length === 0) {
                            // create field_items if items is empty
                            let items = [];
                            for (let i = 0; i < value.length; i++) {
                                field_items = { type: "string", field_key: `${generateUniqueID()}` }
                                items.push(field_items);
                            }
                            setInputItems(items);
                            setDataInputItems(value);

                            // conv. schema data
                            handleConvertedDataInput(value, path + ".value", "array")
                        } else {
                            // use existing schema if items is not empty
                            let items = [];
                            for (let i = 0; i < value.length; i++) {
                                let newFieldItems = JSON.parse(JSON.stringify(field_items))
                                newFieldItems["field_key"] = generateUniqueID();
                                items.push(newFieldItems);
                            }
                            setInputItems(items);
                            setDataInputItems(value);

                            // conv. schema data
                            handleConvertedDataInput(value, path + ".value", "array")
                        }
                    }
                    else {
                        // use existing schema if items is not empty
                        let items = [];
                        if (dataInputItems.length === 0) {
                            let arr = value;
                            arr = Array.from(arr);
                            let currentInputItems = [...inputItems]
                            for (let i = 0; i < value.length; i++) {
                                let newFieldItems = (currentInputItems[i] !== undefined & currentInputItems.length !== 0 ? currentInputItems[i] : {})
                                if (Object.keys(newFieldItems).length === 0) {
                                    newFieldItems["field_key"] = generateUniqueID();
                                    newFieldItems["type"] = "object"
                                    newFieldItems["properties"] = JSON.parse(JSON.stringify(field_items["properties"]))
                                    newFieldItems["required"] = field_items["required"]
                                    Object.keys(newFieldItems["properties"]).forEach((element) => {
                                        newFieldItems["properties"][element]["value"] = arr[i][element]
                                    })
                                }
                                items.push(newFieldItems);
                            }
                            setInputItems(items);
                            setDataInputItems(value);
                        } else {
                            let arr = value;
                            arr = Array.from(arr);
                            for (let i = 0; i < value.length; i++) {
                                let newFieldItems = {}
                                newFieldItems["field_key"] = generateUniqueID();
                                newFieldItems["type"] = "object"
                                newFieldItems["properties"] = JSON.parse(JSON.stringify(field_items["properties"]))
                                newFieldItems["required"] = field_items["required"]
                                Object.keys(newFieldItems["properties"]).forEach((element) => {
                                    newFieldItems["properties"][element]["value"] = arr[i][element]
                                })
                                items.push(newFieldItems);
                            }
                            setInputItems(items);
                            setDataInputItems(value);
                        }
                    }
                }
            } else {
                setInputItems([]);
                setDataInputItems([])
            }
        }
    }, [value])


    var required;
    if (field_required === undefined) {
        required = false;
    } else if (field_required.includes(field_key)) {
        required = true;
    };

    // update the order in properties on drag end
    const handleOnDragEnd = (result) => {
        if (result === null) return;

        if (!result.destination) return;

        if (withinObject & withinArray) {
            // for schema
            let arr = inputItems
            const items = Array.from(arr);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setInputItems(items)

            // for data
            let arr2 = dataInputItems
            const items2 = Array.from(arr2);
            const [reorderedItem2] = items2.splice(result.source.index, 1);
            items2.splice(result.destination.index, 0, reorderedItem2);
            setDataInputItems(items2)

            // for loadedFiles
            let files = loadedFiles
            const items3 = Array.from(files)
            const [reorderedItem3] = items3.splice(result.source.index, 1)
            items3.splice(result.destination.index, 0, reorderedItem3)
            setLoadedFiles(items3)

            /*

            let newPath = path.split(".")
            newPath.pop()
            newPath = newPath.join(".")

            // conv. schema data
            handleConvertedDataInput(items2, newPath + ".value", "array")
            */
        }
        else {
            // for schema
            let arr = inputItems
            const items = Array.from(arr);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setInputItems(items)

            // for data
            let arr2 = dataInputItems
            const items2 = Array.from(arr2);
            const [reorderedItem2] = items2.splice(result.source.index, 1);
            items2.splice(result.destination.index, 0, reorderedItem2);
            setDataInputItems(items2)

            // conv. schema data
            handleConvertedDataInput(items2, path + ".value", "array")

            // for loadedFiles
            let files = loadedFiles
            const items3 = Array.from(files)
            const [reorderedItem3] = items3.splice(result.source.index,1)
            items3.splice(result.destination.index, 0, reorderedItem3)
            setLoadedFiles(items3)
            console.log(items3)
        }
    }

    // handle delete object UI
    const handleDeleteElement = () => {
        /*
        // remove the file in loadedFiles
        let metmet = getValueInSchemaFullPath(convertedSchema, path + ".properties")
        const fileMetadata = getAllFileMetadata(metmet, [])
        if (fileMetadata.length > 0) {
            for (let i = 0; i < fileMetadata.length; i++) {
                const fileIndex = getFileIndex(loadedFiles, fileMetadata[i])
                handleRemoveFile(fileIndex)
            }
        }*/
        // remove the file in loadedFiles
        const fileMetadata = getValue(convertedSchema, path + `.value`)
        //console.log("fileMetadata:", fileMetadata)
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
            //console.log("keywords found:", keywords)
            if (keywords.length > 0) {
                for (let i = 0; i < keywords.length; i++) {
                    const fileIndex = getFileIndex(loadedFiles, keywords[i])
                    handleRemoveFile(fileIndex)
                }
            }
        }


        let value = deleteKey(convertedSchema, path)
        // delete the field key in required array if applicable        
        let pathArr = path.split(".")
        if (pathArr.length <= 2) {
            if (value["required"] !== undefined) {
                let index = value["required"].indexOf(field_key)
                if (index !== -1) {
                    value["required"].splice(index, 1)
                    if (value["required"].length === 0) {
                        delete value["required"]
                    }
                }
            }
        } else {
            pathArr.pop()
            pathArr.pop()
            let val = getValue(value, pathArr.join("."))
            if (val["required"] !== undefined) {
                let index = val["required"].indexOf(field_key)
                if (index !== -1) {
                    let newPath = pathArr.join(".") + ".required"
                    val["required"].splice(index, 1)
                    if (val["required"].length === 0) {
                        value = deleteKey(value, newPath)
                    } else {
                        set(value, newPath, val["required"])
                    }
                }
            }
        }

        updateParent(value)
        handleDataDelete(pathFormData);
    }

    const classes = useStyles();

    // construct UI schema
    let UISchema = {
        "fieldKey": field_key,
        "$id": field_uri,
        "title": field_label,
        "description": field_description,
        "items": field_items,
        "minItems": minItems,
        "maxItems": maxItems,
        "uniqueItems": uniqueItems,
        "type": "array",
        "value": value
    }

    // handle add array item
    const handleAddArrayItem = (desiredValues, inputItemIndex) => {
        // check if current array still has not reached maximum item
        if (maxItems !== undefined) {
            if (maxItems === (dataInputItems.length)) {
                toast.warning(
                    `Can not add more item. Maximum number (${maxItems}) of items has been reached.`,
                    {
                        toastId: "maxNumberWarning"
                    }
                );

                return
            }
        }
        if (field_prefixItems === undefined & field_items !== undefined) {
            if (Object.keys(field_items).length === 0) {
                // create field_items if items is empty
                field_items = { type: "string", field_key: `${generateUniqueID()}` }
                let arr = inputItems;
                const items = Array.from(arr);
                items.push(field_items);
                setInputItems(items);

                // push a new item for the data
                let arr2 = dataInputItems;
                const items2 = Array.from(arr2);
                items2.push("");
                setDataInputItems(items2)
                console.log("Item added.")
            } else {
                let newFieldItems = JSON.parse(JSON.stringify(field_items))
                if (inputItemIndex === undefined) {
                    // use existing schema if items is not empty
                    newFieldItems["field_key"] = generateUniqueID();
                    let arr = inputItems;
                    const items = Array.from(arr);
                    items.push(newFieldItems);
                    setInputItems(items);
                }

                if (["string", "number", "integer", "boolean"].includes(newFieldItems["type"])) {
                    // push a new item for the data
                    let arr2 = dataInputItems;
                    const items2 = Array.from(arr2);
                    items2.push("");
                    //console.log(items2)
                    console.log(items2)
                    setDataInputItems(items2)
                    console.log("Item added.")
                } else if (newFieldItems["type"] === "object") {
                    if (desiredValues !== undefined) {
                        if (inputItemIndex !== undefined) {
                            // for now only works with resource schema!!!!!!!
                            let arr2 = dataInputItems;
                            const items2 = Array.from(arr2);
                            items2[inputItemIndex]["file"] = desiredValues["file"]
                            items2[inputItemIndex]["fileName"] = desiredValues["fileName"]
                            items2[inputItemIndex]["fileType"] = desiredValues["fileType"]
                            setDataInputItems(items2)
                            console.log("Item added.")
                            console.log("Finished adding array item.")
                            // insert the newly inserted data to convertedSchema
                            let newConvertedSchema = convertedSchema
                            set(newConvertedSchema, path + ".value", items2)
                            updateParent(newConvertedSchema)

                        } else {
                            // for now only works with resource schema!!!!!!!
                            let arr2 = dataInputItems;
                            const items2 = Array.from(arr2);
                            items2.push(desiredValues)
                            setDataInputItems(items2)
                            console.log("Item added.")
                            console.log("Finished adding array item.")
                            // insert the newly inserted data to convertedSchema
                            let newConvertedSchema = convertedSchema
                            set(newConvertedSchema, path + ".value", items2)
                            updateParent(newConvertedSchema)
                        }
                    }
                    else {
                        let arr2 = dataInputItems;
                        const items2 = Array.from(arr2);
                        items2.push({});
                        setDataInputItems(items2)
                        console.log("Item added.")
                    }
                }
            }
        }
    }

    // handle delete item
    const handleDeleteArrayItem = (index) => {
        console.log(edit)

        if (withinArray !== undefined & withinArray === true) {
            console.log(path)
            let modPath = path.split('.')
            let lastKey = path.slice(-1)[0]
            console.log(modPath)
            modPath.pop()
            modPath = modPath.join('.')

            let newPath = modPath + '.value' + `.${lastKey}`+`.${field_key}`
            console.log("new path:",newPath)
            // remove the file in loadedFiles
            if (getValue(convertedSchema, newPath) !== undefined) { // which means there is no value yet
                const fileMetadata = getValue(convertedSchema, newPath + `.${index}`)
                if (fileMetadata !== undefined) {
                    let keyword = undefined
                    if (typeof fileMetadata === "object") {
                        Object.keys(fileMetadata).forEach((key) => {
                            if (typeof fileMetadata[key] === "string") {
                                if (fileMetadata[key].includes("fileupload:") && fileMetadata[key].split(";").length === 3) {
                                    keyword = fileMetadata[key]
                                }
                            }
                        })
                    }
                    if (keyword !== undefined) {
                        const fileIndex = getFileIndex(loadedFiles, keyword)
                        handleRemoveFile(fileIndex)
                    }
                }
            }

            // for schema
            let arr = inputItems
            const items = Array.from(arr);
            items.splice(index, 1);
            setInputItems(items)

            // for data
            let arr2 = dataInputItems;
            const items2 = Array.from(arr2);
            items2.splice(index, 1);
            setDataInputItems(items2)

            // conv. schema data
            console.log(items2)
            handleConvertedDataInput(items2, newPath, "array")
        } else {
            // remove the file in loadedFiles
            if (getValue(convertedSchema, path + `.value`) !== undefined) { // which means there is no value yet
                const fileMetadata = getValue(convertedSchema, path + `.value.${index}`)
                if (fileMetadata !== undefined) {
                    let keyword = undefined
                    if (typeof fileMetadata === "object") {
                        Object.keys(fileMetadata).forEach((key) => {
                            if (typeof fileMetadata[key] === "string") {
                                if (fileMetadata[key].includes("fileupload:") && fileMetadata[key].split(";").length === 3) {
                                    keyword = fileMetadata[key]
                                }
                            }
                        })
                    }
                    if (keyword !== undefined) {
                        const fileIndex = getFileIndex(loadedFiles, keyword)
                        handleRemoveFile(fileIndex)
                    } else {
                        handleRemoveFile(index)
                    }
                }
            }

            // for schema
            let arr = inputItems
            const items = Array.from(arr);
            items.splice(index, 1);
            setInputItems(items)

            // for data
            let arr2 = dataInputItems;
            const items2 = Array.from(arr2);
            items2.splice(index, 1);
            setDataInputItems(items2)

            // conv. schema data
            handleConvertedDataInput(items2, path + ".value", "array")
        }
    }


    // handle read data files, to load a selection of files and to integrate their metadata
    const onDrop = useCallback(
        (acceptedFile) => {
            setCurrentFiles(acceptedFile)
        },
        [setCurrentFiles])
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: true,
    });

    return (<>
        <div onClick={() => {
            if (adamant_error_description !== undefined && adamant_field_error !== undefined) {
                set(convertedSchema, path + ".adamant_error_description", (field_description !== undefined ? field_description : ""))
                set(convertedSchema, path + ".adamant_field_error", false)
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
                updateParent(convertedSchema)
            }
        }} style={{ width: "100%", padding: "10px 0px 10px 0px" }}>
            <Accordion expanded={expand} style={inputError ? {
                border: `1px solid #ff7961`,
                '&:not(:lastChild)': {
                    borderBottom: 0,
                }
            } :
                {
                    border: `1px solid rgba(232, 244, 253, 1)`,
                    '&:not(:lastChild)': {
                        borderBottom: 0,
                    }
                }} >
                <AccordionSummary
                    style={inputError ? { backgroundColor: "white", borderRadius: "4px", borderBottom: '1px solid  #ff7961', height: `${expand ? "auto" : "10px"}` } : { backgroundColor: "rgba(232, 244, 253, 1)", borderBottom: '1px solid  rgba(0, 0, 0, .0)', height: `${expand ? "auto" : "10px"}` }}
                    expandIcon={/*withinObject ? null : */
                        <Tooltip placement="top" title={`Collapse/Expand this container`}>
                            <ExpandMoreIcon />
                        </Tooltip>}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                    IconButtonProps={{
                        onClick: expandOnChange
                    }}
                >
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        <div style={{ width: "100%" }}>
                            <Typography style={inputError ? { color: "#ff7961", width: "100%", fontSize: "13pt", lineHeight: `${expand ? "" : "40px"}` } : { width: "100%", fontSize: "13pt", lineHeight: `${expand ? "": "40px"}` }} className={classes.heading}>{field_label + (required ? "*" : "")} {dataInputItems.length > 0 ? `| ${dataInputItems.length} item(s)` : null} </Typography>
                            {expand ? <div style={inputError ? { color: "#ff7961", fontSize:"10pt" } : { color: "gray", fontSize:"10pt" }}>
                                {descriptionText}
                            </div> : null}
                        </div>
                        {field_key === "resource" ? <Button style={{ width: "200px" }} {...getRootProps()} ><input {...getInputProps()} />Read Resources</Button> : null}
                        <div>

                        </div>
                        {edit ? <>
                            <Tooltip placement="top" title={`Edit "${field_label}"`}>
                                <Button onClick={() => setOpenDialog(true)} style={{ marginLeft: "5px" }}><EditIcon color="primary" /></Button>
                            </Tooltip>
                            <Tooltip placement="top" title={`Remove "${field_label}"`}>
                                <Button onClick={() => handleDeleteElement()} style={{ marginLeft: "5px" }}><DeleteIcon color="secondary" /></Button>
                            </Tooltip>
                        </> : null}
                    </div>
                </AccordionSummary>
                <div style={{ paddingTop: "2px" }}></div>
                <AccordionDetails>
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="subforms">
                            {(provided) => (
                                <div style={{ width: "100%" }}  {...provided.droppableProps} ref={provided.innerRef}>
                                    {Object.keys(inputItems).map((item, index) => {
                                        return (
                                            <Draggable isDragDisabled={false} key={inputItems[index]["field_key"]} draggableId={inputItems[index]["field_key"]} index={index}>
                                                {(provided) => (
                                                    <div {...provided.draggableProps} ref={provided.innerRef}>
                                                        <div style={{ display: "flex" }}>
                                                            <div style={{ width: "20px", marginTop: "10px", height: "30px" }} {...provided.dragHandleProps}>
                                                                <Tooltip placement="top" title={`Drag & drop to adjust the order of this item`}>
                                                                    <DragHandleIcon fontSize="small" />
                                                                </Tooltip>
                                                            </div>
                                                            <ArrayItemRenderer arrayFieldKey={field_key} withinObject={withinObject} value={value} pathSchema={pathSchema} pathFormData={pathFormData} dataInputItems={dataInputItems} oDataInputItems={oDataInputItems} oSetDataInputItems={oSetDataInputItems} setDataInputItems={setDataInputItems} field_label={field_label} field_items={inputItems.length !== 0 ? inputItems[index] : field_items} edit={true} handleDeleteArrayItem={handleDeleteArrayItem} path={path} fieldIndex={index} fieldkey={inputItems[index]["field_key"]} type={inputItems[index]["type"]} isResource = {field_key === 'resource'? true : false} />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                    {field_key !== "resource" ? <div style={{ display: "flex", justifyContent: "right" }}>
                                        <Button onClick={() => { handleAddArrayItem() }} style={{ fontSize: "12px", marginLeft: "5px", marginTop: "5px", height: "45px" }}><AddIcon style={{ paddingRight: "5px" }} fontSize="small" color="primary" /> Add Item</Button>
                                    </div> : null}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </AccordionDetails>
            </Accordion>
        </div>
        {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
    </>
    );
};

export default ArrayType;