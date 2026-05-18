import React, { useState, useContext, useEffect } from "react";
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
import getFileIndex from "../utils/getFileIndex";
import getValueInSchemaFullPath from "../utils/getValueInSchemaFullPath";

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
    const { handleRemoveFile, loadedFiles, updateParent, convertedSchema, handleDataDelete, handleConvertedDataInput } = useContext(FormContext);
    const [inputItems, setInputItems] = useState([]);
    const [dataInputItems, setDataInputItems] = useState([]);
    //const [descriptionText, setDescriptionText] = useState(field_description !== undefined ? field_description : "")
    const [descriptionText, setDescriptionText] = useState()
    const [inputError, setInputError] = useState(false)

    // update description text state as soon as new field description is obtained
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

        }
    }

    // handle delete object UI
    const handleDeleteElement = () => {
        // TO DO: must check whether any elements in this array has files!

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
    const handleAddArrayItem = () => {
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
                    console.log(items2)
                    setDataInputItems(items2)
                } else if (newFieldItems["type"] === "object") {
                    let arr2 = dataInputItems;
                    const items2 = Array.from(arr2);
                    items2.push({});
                    setDataInputItems(items2)
                }
            }
        }
    }

    // handle delete item
    const handleDeleteArrayItem = (index) => {
        // remove the file in loadedFiles
        const fileMetadata = getValue(convertedSchema, path + `${index}.value`)
        if (fileMetadata !== undefined) {
            const fileIndex = getFileIndex(loadedFiles, fileMetadata)
            handleRemoveFile(fileIndex)
        }

        if (withinArray !== undefined & withinArray === true) {
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
        } else {
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
                    style={inputError ? { backgroundColor: "white", borderRadius: "4px", borderBottom: '1px solid  #ff7961' } : { backgroundColor: "rgba(232, 244, 253, 1)", borderBottom: '1px solid  rgba(0, 0, 0, .0)' }}
                    expandIcon={withinObject ? null :
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
                            <Typography style={inputError ? { color: "#ff7961" } : {}} className={classes.heading}>{field_label + (required ? "*" : "")}</Typography>
                            {expand ? <div style={inputError ? { color: "#ff7961" } : { color: "gray" }}>
                                {descriptionText}
                            </div> : null}
                        </div>
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
                                                            <ArrayItemRenderer arrayFieldKey={field_key} withinObject={withinObject} value={value} pathSchema={pathSchema} pathFormData={pathFormData} dataInputItems={dataInputItems} oDataInputItems={oDataInputItems} oSetDataInputItems={oSetDataInputItems} setDataInputItems={setDataInputItems} field_label={field_label} field_items={inputItems.length !== 0 ? inputItems[index] : field_items} edit={true} handleDeleteArrayItem={handleDeleteArrayItem} path={path} fieldIndex={index} fieldkey={inputItems[index]["field_key"]} type={inputItems[index]["type"]} />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                    <div style={{ display: "flex", justifyContent: "right" }}>
                                        <Button onClick={() => { handleAddArrayItem() }} style={{ fontSize: "12px", marginLeft: "5px", marginTop: "5px", height: "45px" }}><AddIcon style={{ paddingRight: "5px" }} fontSize="small" color="primary" /> Add Item</Button>
                                    </div>
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