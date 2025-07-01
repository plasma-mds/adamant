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
import { FileIcon, defaultStyles } from 'react-file-icon';
import mimeTypesExt from '../../assets/mime-types-extensions-swapped.json'


const useStyles = makeStyles((theme) => ({
    root: {
        width: 'auto',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));


const StringType = ({ adamant_field_error, adamant_error_description, minLength, maxLength, withinObject, field_uri, dataInputItems, setDataInputItems, withinArray, path, pathFormData, field_required, field_index, edit, field_key, field_label, field_description, field_enumerate, defaultValue, value }) => {


    //const [descriptionText, setDescriptionText] = useState(adamant_error_description !== undefined ? adamant_error_description : field_description !== undefined ? field_description : "");
    const [descriptionText, setDescriptionText] = useState()
    const [inputError, setInputError] = useState(adamant_field_error !== undefined ? adamant_field_error : false);
    const [openDialog, setOpenDialog] = useState(false);
    const { updateParent, convertedSchema, handleDataDelete, handleConvertedDataInput, SEMSelectedDevice, setSEMSelectedDevice } = useContext(FormContext);
    const [fieldValue, setFieldValue] = useState(defaultValue !== undefined ? defaultValue : value !== undefined ? value : "")
    const [fieldEnumerate, setFieldEnumerate] = useState()
    //const [required, setRequired] = useState(false)
    const classes = useStyles();

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

    const handleOnChange = (event) => {
        setFieldValue(event.target.value)

        // this is for SEM form only!
        if (field_key === "semDevice") {
            setSEMSelectedDevice(event.target.value)
        }
    }

    // for visual feedback on the field after validation
    useEffect(() => {
        setInputError(adamant_field_error !== undefined ? adamant_field_error : false)
        setDescriptionText(adamant_error_description !== undefined ? adamant_error_description : field_description !== undefined ? field_description : "")
    }, [adamant_error_description, adamant_field_error])

    // set stuff back to normal onFocus
    const handleOnFocus = () => {
        if (adamant_error_description !== undefined && adamant_field_error !== undefined) {
            set(convertedSchema, path + ".adamant_error_description", (field_description !== undefined ? field_description : ""))
            set(convertedSchema, path + ".adamant_field_error", false)
            setInputError(false)
            setDescriptionText(field_description !== undefined ? field_description : "")
        }
    }

    // for SEM only - currently hardcoded
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
        "minLength": minLength,
        "maxLength": maxLength,
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
            // conv. schema data
            handleConvertedDataInput(value, newPath + ".value", "string")

            // update field value
            setFieldValue(event.target.value)
        } else {
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
                        onFocus={() => { handleOnFocus() }}
                        error={inputError}
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
                        helperText={descriptionText}
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
                            size='small'
                            onFocus={() => { handleOnFocus() }}
                            error={inputError}
                            multiline
                            disabled={["filetype", "fileName", "hash", "hashAlgorithm"].includes(field_key) ? true : false }
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !(e.shiftKey)) {
                                    e.preventDefault();
                                    //setFieldValue(e.target.value);
                                }
                            }}
                            onBlur={(event) => handleOnBlur(event, pathFormData, "string")} required={required} helperText={descriptionText} onChange={(event) => { handleOnChange(event) }} value={fieldValue} fullWidth={true} className={classes.heading} id={field_key} label={field_label} variant="outlined" />
                        {field_key === "filetype" && mimeTypesExt[fieldValue] !== undefined ? <div style={{ "width": "50px", "paddingLeft": "5px" }}><FileIcon extension={mimeTypesExt[fieldValue].substring(1)} {...defaultStyles[mimeTypesExt[fieldValue].substring(1)]} /></div> : null}
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
                        <TextField
                            size='small'
                            onFocus={() => { handleOnFocus() }}
                            error={inputError}
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
                            helperText={descriptionText}
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
