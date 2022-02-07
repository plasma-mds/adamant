import React, { useContext, useEffect, useState } from 'react'
import TextField from "@material-ui/core/TextField"
import { makeStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButton } from '@material-ui/core';
import EditElement from '../EditElement';
import { FormContext } from '../../FormContext';
import deleteKey from '../utils/deleteKey';
import { Tooltip } from '@material-ui/core';
import getValue from '../utils/getValue';
import set from 'set-value';


const useStyles = makeStyles((theme) => ({
    root: {
        width: 'auto',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));

const style = {
    paddingTop: "10px",
    paddingBottom: "10px",
}


const StringType = ({ withinObject, field_uri, dataInputItems, setDataInputItems, withinArray, path, pathFormData, field_required, field_index, edit, field_key, field_label, field_description, field_enumerate, defaultValue, value }) => {


    //const [descriptionText, setDescriptionText] = useState(field_description);
    const [openDialog, setOpenDialog] = useState(false);
    const { updateParent, convertedSchema, handleDataInput, handleDataDelete, handleConvertedDataInput, SEMSelectedDevice, setSEMSelectedDevice } = useContext(FormContext);
    const [fieldValue, setFieldValue] = useState(defaultValue !== undefined ? defaultValue : value !== undefined ? value : "")
    const [fieldEnumerate, setFieldEnumerate] = useState()
    //const [required, setRequired] = useState(false)
    const classes = useStyles();

    const handleOnChange = (event) => {
        setFieldValue(event.target.value)

        // this is for SEM form only!
        if (field_key === "semDevice") {
            setSEMSelectedDevice(event.target.value)
        }
    }

    // for SEM only
    useEffect(() => {
        if (field_key === "semOperator") {
            if (SEMSelectedDevice === "") {
                setFieldEnumerate(field_enumerate)
                setFieldValue("")
            } else {
                try {
                    let semOperatorDeviceList = require("../../assets/sem-operator-device-list.json")
                    setFieldValue("")
                    setFieldEnumerate(semOperatorDeviceList[SEMSelectedDevice])
                }
                catch (error) {
                    console.log(error)
                    setFieldValue("")
                    setFieldEnumerate(field_enumerate)
                }
            }
        }

    }, [SEMSelectedDevice, field_enumerate, field_key])

    // clean up empty strings in the paths
    path = path.split(".")
    path = path.filter(e => e)
    path = path.join(".")
    pathFormData = pathFormData.split(".")
    pathFormData = pathFormData.filter(e => e)
    pathFormData = pathFormData.join(".")


    var required
    if (field_required === undefined) {
        required = false;
    } else if (field_required.includes(field_key)) {
        required = true;
    };

    var enumerated
    if (field_enumerate === undefined) {
        enumerated = false;
    } else {
        enumerated = true;
    }

    // construct UI schema
    let UISchema = {
        "fieldKey": field_key,
        "title": field_label,
        "description": field_description,
        "$id": field_uri,
        "type": "string",
        "value": value,
    }

    // handle delete field UI
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

    // handle on blur
    const handleOnBlur = (event, pathFormData, type) => {
        if (withinArray !== undefined & withinArray) {
            let newPathFormData = pathFormData.split(".");
            newPathFormData.pop()
            newPathFormData = newPathFormData.join(".")

            let newPath = path.split(".")
            newPath.pop()
            newPath = newPath.join(".")

            let arr = dataInputItems;
            const items = Array.from(arr);
            items[field_index][field_key] = event.target.value;
            setDataInputItems(items);

            // store to the main form data
            let value = {
                "target": {
                    "value":
                        items
                }
            }
            handleDataInput(value, newPathFormData, "string")
            // conv. schema data
            handleConvertedDataInput(value, newPath + ".value", "string")

            // update field value
            setFieldValue(event.target.value)
        } else {
            handleDataInput(event, pathFormData, type)
            // conv. schema data
            handleConvertedDataInput(event, path + ".value", "string")
            // update field value
            setFieldValue(event.target.value)
        }
    }

    // update this field input value everytime the value changes. E.g., when autofilling or first render of the field when defaultvalue exists 
    useEffect(() => {
        if (withinArray !== undefined & withinArray === true) {
            let newPathFormData = pathFormData.split(".");
            newPathFormData.pop()
            newPathFormData = newPathFormData.join(".")

            let newPath = path.split(".")
            newPath.pop()
            newPath = newPath.join(".")

            let arr = dataInputItems;
            const items = Array.from(arr);

            let dataInputItemVal = "";
            if (items.length !== 0) {
                if (typeof (items[0]) === "object") {
                    dataInputItemVal = items[field_index][field_key]
                }
            }
            let val = (value !== undefined ? value : defaultValue !== undefined ? defaultValue : dataInputItemVal !== undefined ? dataInputItemVal : field_enumerate !== undefined ? field_enumerate[0] : "")
            if (val === "") {
                setFieldValue("")
            } else {
                if (withinObject) {
                    // if withinArray and withinObject skip setDataInputItems etc
                    setFieldValue(val)
                }
                else {
                    setDataInputItems(items);

                    // store to the main form data
                    let event = {
                        "target": {
                            "value":
                                items
                        }
                    }
                    handleDataInput(event, newPathFormData, "string")
                    // conv. schema data
                    handleConvertedDataInput(event, newPath + ".value", "string")
                    // update field value
                    setFieldValue(val)
                }
            }
        } else {
            let val = (value !== undefined ? value : defaultValue !== undefined ? defaultValue : field_enumerate !== undefined ? field_enumerate[0] : "")
            let event = {
                "target": {
                    "value":
                        val
                }
            }

            if (val === "") {
                setFieldValue(val)
            } else {
                handleDataInput(event, pathFormData, "string")
                // conv. schema data
                handleConvertedDataInput(event, path + ".value", "string")
                // update field value
                setFieldValue(val)
            }
        }

    }, [value])

    if (fieldEnumerate !== undefined) {
        return (
            <>
                <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                    < TextField
                        onBlur={(event) => handleOnBlur(event, pathFormData, "string")}
                        onChange={event => handleOnChange(event)}
                        required={required}
                        select
                        fullWidth={true}
                        className={classes.heading}
                        id={field_key}
                        label={field_label}
                        variant="outlined"
                        SelectProps={{
                            native: true,
                        }
                        }
                        helperText={field_description}
                        value={fieldValue === undefined ? defaultValue : fieldValue}
                    >
                        {
                            fieldEnumerate.map((content, index) => (
                                <option key={index} value={content}>
                                    {content}
                                </option>
                            ))
                        }
                    </TextField >
                    {edit ? <>
                        <Tooltip placement="top" title={`Edit field "${field_label}"`}>
                            <IconButton onClick={() => setOpenDialog(true)} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}>
                                <EditIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip placement="top" title={`Remove field "${field_label}"`}>
                            <IconButton onClick={() => handleDeleteElement()} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}>
                                <DeleteIcon fontSize="small" color="secondary" />
                            </IconButton>
                        </Tooltip>
                    </> : null}
                </div >
                {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} enumerated={true} defaultValue={defaultValue} field_enumerate={fieldEnumerate} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
            </>
        )
    } else {
        if (field_enumerate === undefined) {
            return (
                <>
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        <TextField
                            multiline
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !(e.shiftKey)) {
                                    e.preventDefault();
                                    //setFieldValue(e.target.value);
                                }
                            }}
                            onBlur={(event) => handleOnBlur(event, pathFormData, "string")} required={required} helperText={field_description} onChange={(event) => { handleOnChange(event) }} value={fieldValue} fullWidth={true} className={classes.heading} id={field_key} label={field_label} variant="outlined" />
                        {edit ? <>
                            <Tooltip placement="top" title={`Edit field "${field_label}"`}>
                                <IconButton onClick={() => setOpenDialog(true)} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}>
                                    <EditIcon fontSize="small" color="primary" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip placement="top" title={`Remove field "${field_label}"`}>
                                <IconButton onClick={() => handleDeleteElement()} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}>
                                    <DeleteIcon fontSize="small" color="secondary" />
                                </IconButton>
                            </Tooltip>
                        </> : null}
                    </div>
                    {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} defaultValue={defaultValue} enumerated={enumerated} field_enumerate={field_enumerate} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
                </>
            )
        } else {
            return (
                <>
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        < TextField
                            onBlur={(event) => handleOnBlur(event, pathFormData, "string")}
                            onChange={event => handleOnChange(event)}
                            required={required}
                            select
                            fullWidth={true}
                            className={classes.heading}
                            id={field_key}
                            label={field_label}
                            variant="outlined"
                            SelectProps={{
                                native: true,
                            }
                            }
                            helperText={field_description}
                            value={fieldValue === undefined ? defaultValue : fieldValue}
                        >
                            {
                                field_enumerate.map((content, index) => (
                                    <option key={index} value={content}>
                                        {content}
                                    </option>
                                ))
                            }
                        </TextField >
                        {edit ? <>
                            <Tooltip placement="top" title={`Edit field "${field_label}"`}>
                                <IconButton onClick={() => setOpenDialog(true)} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}>
                                    <EditIcon fontSize="small" color="primary" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip placement="top" title={`Remove field "${field_label}"`}>
                                <IconButton onClick={() => handleDeleteElement()} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}>
                                    <DeleteIcon fontSize="small" color="secondary" />
                                </IconButton>
                            </Tooltip>
                        </> : null}
                    </div >
                    {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} enumerated={enumerated} defaultValue={defaultValue} field_enumerate={field_enumerate} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
                </>
            )
        }
    }
};

export default StringType;
