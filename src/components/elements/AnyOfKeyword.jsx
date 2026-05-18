import React, { useState, useContext } from "react";
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
//import Accordion from "@material-ui/core/Accordion";
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
import { IconButton } from "@material-ui/core";
import { TextField } from "@material-ui/core";
import ElementRenderer from "../ElementRenderer";
import ObjectType from "./ObjectType";
import object2array from "../utils/object2array";
import getValue from "../utils/getValue";
import set from "set-value";
import { Tooltip } from "@material-ui/core";
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';

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

const AnyOfKeyword = ({ pathFormData, path, field_required, field_uri, field_key, field_index, edit, field_label, field_description, field_prefixItems, anyOf_list }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [expand, setExpand] = useState(true); // set to "true" for normally open accordion
    const { updateParent, convertedSchema, handleDataDelete, handleConvertedDataInput } = useContext(FormContext);
    const [field_items, setField_items] = useState(Array.isArray(anyOf_list) & anyOf_list[0]["type"] === "array" ? anyOf_list[0]["items"] : anyOf_list[0])
    const [globalIndex, setGlobalIndex] = useState(0);
    const [inputItems, setInputItems] = useState([]);
    const [dataInputItems, setDataInputItems] = useState([]);

    // clean up empty strings in the paths
    path = path.split(".")
    path = path.filter(e => e)
    path = path.join(".")
    pathFormData = pathFormData.split(".")
    pathFormData = pathFormData.filter(e => e)
    pathFormData = pathFormData.join(".")


    let newPath = path.split(".")
    newPath.pop()
    newPath = newPath.join(".")

    let newPathFormData = pathFormData.split(".")
    newPathFormData.pop()
    newPathFormData = newPathFormData.join(".")


    // This is to expand or contract the accordion, because normally open is used 
    const expandOnChange = () => {
        const value = expand
        setExpand(!value)
    };

    let schemaList = Array(anyOf_list.length).fill().map((x, i) => i)

    // select existing schema option from anyOf list
    const handleChooseAnyOfSchema = (event) => {
        // reset states
        setDataInputItems([]);
        setInputItems([]);

        // get rid of the current value everytime the subschema changes
        handleDataDelete(pathFormData)
        let val = getValue(convertedSchema, path)
        delete val["value"]
        set(convertedSchema, path, val)
        console.log(convertedSchema)
        // if properties exist then delete it
        let val2 = getValue(convertedSchema, path)
        if (val2["properties"] !== undefined) {
            delete val2["properties"]
            set(convertedSchema, path, val2)
        }
        // if type exist then delete it
        let val3 = getValue(convertedSchema, path)
        if (val3["type"] !== undefined) {
            delete val3["type"]
            set(convertedSchema, path, val3)
        }

        const index = parseInt(event.target.value)
        setGlobalIndex(index)
        if (anyOf_list[index]["type"] === "array") {
            setField_items(anyOf_list[index]["items"])
        }
        else if (anyOf_list[index]["type"] === "object") {
            let prop = object2array(anyOf_list[index]["properties"])
            let val = getValue(convertedSchema, path)
            val["properties"] = prop
            val["type"] = "object"
            set(convertedSchema, path, val)
            updateParent(convertedSchema)
            setField_items(prop)
        }
        else {
            setField_items(anyOf_list[index])
        }
    }

    var required;
    if (field_required === undefined) {
        required = false;
    } else if (field_required.includes(field_key)) {
        required = true;
    };

    // update the order in properties on drag end
    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

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

    // handle delete object UI
    const handleDeleteElement = () => {
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

    /*
    // construct UI schema
    let UISchema = {
        "fieldKey": field_key,
        "title": field_label,
        "description": field_description,
        "items": field_items,
        "type": [anyOf_list[globalIndex]["type"]]
    }*/

    let UISchema = {
        "fieldKey": field_key,
        "title": field_label,
        "description": field_description,
        "$id": field_uri,
        "items": field_items,
        "type": "anyOf",
    }

    // handle add array item
    const handleAddArrayItem = () => {
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

    return (<>
        <div style={{ width: "100%", padding: "10px 0px 10px 0px" }}>
            <Accordion expanded={expand} >
                <AccordionSummary
                    expandIcon={
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
                            <Typography className={classes.heading}>{field_label + (required ? "*" : "")}</Typography>
                            {expand ? <div style={{ color: "gray" }}>
                                {field_description}
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
                <TextField
                    onChange={(event) => handleChooseAnyOfSchema(event)}
                    style={{ width: "220px", marginLeft: "10px", marginTop: "20px" }}
                    fullWidth={false}
                    select
                    id={"select-schema"}
                    label={"Choose a subschema"}
                    SelectProps={{ native: true }}
                >
                    {schemaList.map((content, index) => (
                        <option key={index} value={content}>
                            {content}
                        </option>
                    ))}
                </TextField>
                {anyOf_list[globalIndex]["type"] === "array" ?
                    <AccordionDetails>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            <Droppable droppableId="subforms">
                                {(provided) => (
                                    <div style={{ width: "100%" }}  {...provided.droppableProps} ref={provided.innerRef}>
                                        {Object.keys(inputItems).map((item, index) => {
                                            return (
                                                <Draggable key={inputItems[index]["field_key"]} draggableId={inputItems[index]["field_key"]} index={index}>
                                                    {(provided) => (
                                                        <div {...provided.draggableProps} ref={provided.innerRef}>
                                                            <div style={{ display: "flex" }}>
                                                                <div style={{ width: "20px", marginTop: "10px", height: "30px" }} {...provided.dragHandleProps}>
                                                                    <DragHandleIcon fontSize="small" />
                                                                </div>
                                                                {/*
                                                                <ArrayItemRenderer field_label={field_label} field_items={inputItems[index]} edit={true} handleDeleteArrayItem={handleDeleteArrayItem} path={path + ".properties"} fieldIndex={index} fieldkey={inputItems[index]["field_key"]} type={inputItems[index]["type"]} />
                                                                */}

                                                                <ArrayItemRenderer pathFormData={pathFormData} dataInputItems={dataInputItems} setDataInputItems={setDataInputItems} field_label={field_label} field_items={field_items} edit={true} handleDeleteArrayItem={handleDeleteArrayItem} path={path} fieldIndex={index} fieldkey={inputItems[index]["field_key"]} type={inputItems[index]["type"]} />
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
                    :
                    anyOf_list[globalIndex]["type"] === "object" ?
                        <div style={{ padding: "10px" }}>
                            <ObjectType
                                path={path}
                                pathFormData={pathFormData !== undefined ? pathFormData : field_key}
                                field_key={field_key}
                                field_label={undefined}
                                field_description={undefined}
                                field_required={field_required}
                                field_properties={field_items}
                                edit={false}
                            />
                        </div>
                        :
                        <div style={{ padding: "10px" }}>
                            <ElementRenderer pathFormData={newPathFormData} path={newPath} fieldkey={field_key} fieldIndex={field_index} elementRequired={field_required} edit={false} field={field_items} />
                        </div>}
            </Accordion>
        </div>
        {openDialog ? <EditElement field_uri={field_uri} anyOf_list={anyOf_list} pathFormData={pathFormData} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
    </>
    );
};

export default AnyOfKeyword;