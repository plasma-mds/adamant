import React, { useState, useContext, useEffect } from "react";
import { makeStyles, withStyles } from '@material-ui/core/styles';
import ElementRenderer from "../ElementRenderer";
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
//import Accordion from "@material-ui/core/Accordion";
import { AccordionDetails } from '@material-ui/core';
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from "@material-ui/icons/AddBox";
import DeleteIcon from "@material-ui/icons/Delete";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FormContext } from "../../FormContext";
import DragHandleIcon from "@material-ui/icons/DragIndicator";
import deleteKey from "../utils/deleteKey";
import EditElement from "../EditElement";
import { Tooltip } from "@material-ui/core";
import getValue from "../utils/getValue";
import set from "set-value";
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import getValueInSchemaFullPath from "../utils/getValueInSchemaFullPath";
import getFileIndex from "../utils/getFileIndex";

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
        border: '1px solid rgba(232, 244, 253, 1)',
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
        backgroundColor: 'rgba(232, 244, 253, 1)',
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

const ObjectType = ({ adamant_error_description, adamant_field_error, dataInputItems, setDataInputItems, withinArray, withinObject, field_uri, path, pathSchema, pathFormData, field_required, object_is_required, field_key, field_index, edit, field_label, field_description, field_properties }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [openDialogAddElement, setOpenDialogAddElement] = useState(false);
    const [expand, setExpand] = useState(true)// set to "true" for normally open accordion
    const { handleRemoveFile, loadedFiles, updateParent, convertedSchema, handleDataDelete } = useContext(FormContext);
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

    var required
    if (object_is_required === undefined) {
        required = false;
    } else if (object_is_required.includes(field_key)) {
        required = true;
    };

    // This is to expand or contract the accordion, because normally open is used 
    const expandOnChange = () => {
        const value = expand
        setExpand(!value)
    };

    // update the order in properties on drag end
    const handleOnDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(field_properties);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const set = require("set-value");
        let value = { ...convertedSchema }
        set(convertedSchema, path + ".properties", items)
        updateParent(value);
    }

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

    // handle delete object UI
    const handleDeleteElement = () => {
        // remove the file in loadedFiles
        let metmet = getValueInSchemaFullPath(convertedSchema, path + ".properties")
        const fileMetadata = getAllFileMetadata(metmet, [])
        if (fileMetadata.length > 0) {
            for (let i = 0; i < fileMetadata.length; i++) {
                const fileIndex = getFileIndex(loadedFiles, fileMetadata[i])
                handleRemoveFile(fileIndex)
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

    // construct UI schema
    let UISchema = {
        "fieldKey": field_key,
        "title": field_label,
        "description": field_description,
        "required": field_required,
        "properties": field_properties,
        "$id": field_uri,
        "type": "object"
    }

    // default schema for add new element
    let defaultSchema = {}

    const classes = useStyles();

    return (<>
        <div onClick={() => {
            if (adamant_error_description !== undefined && adamant_field_error !== undefined) {
                set(convertedSchema, path + ".adamant_error_description", (field_description !== undefined ? field_description : ""))
                set(convertedSchema, path + ".adamant_field_error", false)
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
                updateParent(convertedSchema)
            }
        }}
            style={{ width: "100%", padding: "10px 0px 10px 0px" }}>
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
                }}>
                <AccordionSummary
                    style={inputError ? { backgroundColor: "white", borderRadius: "4px", borderBottom: '1px solid  #ff7961', height: `${expand ? "auto" : "10px"}` } : { backgroundColor: "rgba(232, 244, 253, 1)", borderBottom: '1px solid  rgba(0, 0, 0, .0)', height: `${expand ? "auto" : "10px"}` }}
                    expandIcon={
                        <Tooltip placement="top" title={`Collapse/Expand this container`}>
                            <ExpandMoreIcon />
                        </Tooltip>}
                    IconButtonProps={{
                        onClick: expandOnChange
                    }}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        <div style={{ width: "100%" }}>
                            <Typography style={inputError ? { color: "#ff7961", fontSize: "13pt", lineHeight: `${expand ? "" : "40px"}` } : { fontSize: "13pt", lineHeight: `${expand ? "" : "40px"}` }} className={classes.heading}>{field_label + (required ? "*" : "")}</Typography>
                            {expand ? <div style={inputError ? { color: "#ff7961", fontSize: "10pt" } : { color: "gray", fontSize: "10pt" }}>
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
                <Divider />
                <AccordionDetails>
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="subforms">
                            {(provided) => (
                                <div style={{ width: "100%" }}  {...provided.droppableProps} ref={provided.innerRef}>
                                    {Object.keys(field_properties).map((item, index) => {
                                        return (
                                            <Draggable isDragDisabled={!edit} key={field_properties[item]["fieldKey"]} draggableId={field_properties[item]["fieldKey"]} index={index}>
                                                {(provided) => (
                                                    <div {...provided.draggableProps} ref={provided.innerRef}>
                                                        <div style={{ display: "flex" }}>
                                                            {edit ? <div style={{ width: "20px", marginTop: "10px", height: "30px" }} {...provided.dragHandleProps}>
                                                                <Tooltip placement="top" title={`Drag & drop to adjust the order of this field`}>
                                                                    <DragHandleIcon fontSize="small" />
                                                                </Tooltip>
                                                            </div> : null}
                                                            <ElementRenderer withinArray={withinArray} withinObject={withinObject} path={path + ".properties"} pathSchema={pathSchema + ".properties"} pathFormData={pathFormData} fieldkey={field_properties[item]["fieldKey"]} fieldIndex={item} elementRequired={field_required} edit={edit} field={field_properties[item]} />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                    {edit ? <div style={{ display: "flex", justifyContent: "right" }}>
                                        <Tooltip placement="top" title={`Add a new field to "${field_label}"`}>
                                            <Button onClick={() => setOpenDialogAddElement(true)} style={{ marginLeft: "5px" }}><AddIcon color="primary" /> ADD ELEMENT</Button>
                                        </Tooltip>
                                    </div> : null}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </AccordionDetails>
            </Accordion>
        </div>
        {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} field_label={field_label} /> : null}
        {openDialogAddElement ? <EditElement editOrAdd={"add"} openDialog={openDialogAddElement} setOpenDialog={setOpenDialogAddElement} path={path} defaultSchema={defaultSchema} field_label={field_label} /> : null}
    </>);
};

export default ObjectType;