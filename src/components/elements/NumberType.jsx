import React, { useContext, useState, useEffect } from 'react'
import TextField from "@material-ui/core/TextField";
import { makeStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButton } from '@material-ui/core';
import EditElement from '../EditElement';
import { FormContext } from '../../FormContext';
import deleteKey from '../utils/deleteKey';
import { InputAdornment } from '@material-ui/core';
import getUnit from '../utils/getUnit';
import { MathComponent } from 'mathjax-react'
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


const NumberType = ({ adamant_error_description, adamant_field_error, minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, field_uri, value, dataInputItems, setDataInputItems, withinArray, withinObject, path, pathFormData, defaultValue, field_required, field_index, edit, field_key, field_label, field_description, field_enumerate }) => {
    //const [descriptionText, setDescriptionText] = useState(field_description !== undefined ? field_description : "");
    const [descriptionText, setDescriptionText] = useState()
    const [openDialog, setOpenDialog] = useState(false);
    const { updateParent, convertedSchema, handleDataDelete, handleConvertedDataInput } = useContext(FormContext);
    const [inputValue, setInputValue] = useState(defaultValue !== undefined & value === undefined ? defaultValue : value === undefined ? "" : value)//useState(defaultValue !== undefined ? defaultValue : value)
    const [inputError, setInputError] = useState(false)
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

    let unit = getUnit(field_label)
    if (unit[0] === '%') {
        unit = "\\" + unit
    }

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
        "type": "number",
        "value": value,
        "minimum": minimum,
        "maximum": maximum,
        "exclusiveMinimum": exclusiveMinimum,
        "exclusiveMaximum": exclusiveMaximum,
        "multipleOf": multipleOf
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

    // handle input on change for number a.k.a signed float
    const handleInputOnChange = (event) => {
        setInputError(false)
        setDescriptionText(field_description !== undefined ? field_description : "")
        let inputValueVar
        if (inputValue === undefined) {
            inputValueVar = ""
        } else {
            inputValueVar = inputValue
        }
        inputValueVar = inputValueVar.toString()
        if (((inputValueVar.split('.').length - 1) > 1) & (event.target.value.at(-1) === '.')) {
            let value = inputValueVar
            value = value.replace(/ /g, '')
            setInputValue(value)

            if (value.toString().length - event.target.value.length !== 0) {
                setInputError(true)
                setDescriptionText("Invalid input type. This field only accepts input of a number type.")
            } else {
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
            }
        } else {
            let value = event.target.value.replace(/(?!^-)[^0-9.]/g, "").replace(/(\..*)\./g, '$1')
            value = value.replace(/ /g, '')
            setInputValue(value)

            if (value.toString().length - event.target.value.length !== 0) {
                setInputError(true)
                setDescriptionText("Invalid input type. This field only accepts input of a number type.")
            } else {
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
            }
        }
    }

    // handle input on blur for signed integer
    const handleInputOnBlur = () => {

        setInputError(false)
        setDescriptionText(field_description !== undefined ? field_description : "")

        if (withinArray !== undefined & withinArray) {

            let value = inputValue;
            if (value === "") {
                // handle clear input
                setInputValue("")
                // store in jData
                let newPathFormData = pathFormData.split(".");
                newPathFormData.pop()
                newPathFormData = newPathFormData.join(".")

                let newPath = path.split(".")
                newPath.pop()
                newPath = newPath.join(".")

                let arr = dataInputItems;
                const items = Array.from(arr);
                items[field_index][field_key] = "";
                setDataInputItems(items);

                // conv. schema data
                handleConvertedDataInput(items, newPath + ".value", "number")
            } else {
                value = parseFloat(value)
                if (!isNaN(value)) {
                    setInputValue(value)
                    // store in jData
                    let newPathFormData = pathFormData.split(".");
                    newPathFormData.pop()
                    newPathFormData = newPathFormData.join(".")

                    let newPath = path.split(".")
                    newPath.pop()
                    newPath = newPath.join(".")

                    let arr = dataInputItems;
                    const items = Array.from(arr);
                    items[field_index][field_key] = value;
                    setDataInputItems(items);

                    // conv. schema data
                    handleConvertedDataInput(items, newPath + ".value", "number")
                }
            }
        } else {
            let value = inputValue;
            if (value === "") {
                // handle clear input
                setInputValue("")
                // conv. schema data
                handleConvertedDataInput("", path + ".value", "number")
            } else {
                value = parseFloat(value)
                if (!isNaN(value)) {
                    setInputValue(value)
                    // conv. schema data
                    handleConvertedDataInput(value, path + ".value", "number")
                }
            }
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
                setInputValue("")
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
            }
            else if (typeof (val) !== "number") {
                setInputValue(val)
                setInputError(true)
                setDescriptionText("Invalid input type. This field only accepts input of a number type.")
            }
            else {
                if (withinObject) {
                    // if withinArray and withinObject skip setDataInputItems etc
                    setInputValue(val)
                } else {
                    items[field_index][field_key] = val;
                    setDataInputItems(items);

                    // store to the main form data
                    /*let event = {
                        "target": {
                            "value":
                                items
                        }
                    }*/
                    // conv. schema data
                    handleConvertedDataInput(val, newPath + ".value", "number")
                    // update field value
                    setInputValue(val)
                }
            }
        }
        else {
            let val = (value !== undefined ? value : defaultValue !== undefined ? defaultValue : field_enumerate !== undefined ? field_enumerate[0] : "")

            // check if input is of type number
            if (val === "") {
                setInputValue("")
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
            }
            else if (typeof (val) !== "number") {
                setInputValue(val)
                setInputError(true)
                setDescriptionText("Invalid input type. This field only accepts input of a number type.")
            } else {
                // conv. schema data
                handleConvertedDataInput(val, path + ".value", "number")
                // update field value
                setInputValue(val)
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
            }
        }
    }, [value])

    if (field_enumerate === undefined) {

        return (
            <>
                <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                    <TextField size='small' onFocus={() => {
                        if (adamant_error_description !== undefined && adamant_field_error !== undefined) {
                            let cloned = JSON.parse(JSON.stringify(convertedSchema))
                            set(cloned, path + ".adamant_error_description", (field_description !== undefined ? field_description : ""))
                            set(cloned, path + ".adamant_field_error", false)
                            setInputError(false)
                            setDescriptionText(field_description !== undefined ? field_description : "")
                            updateParent(cloned)
                        }

                        if (inputError === true) {
                            setInputValue("")
                            // then delete the value the convertedSchema
                            let value = { ...convertedSchema }
                            if (withinArray === undefined | (withinArray !== undefined & withinArray === true)) {
                                value = deleteKey(value, path + ".value")
                                updateParent(value)
                            } else {
                                let newPath = path.split(".")
                                newPath.pop()
                                newPath = newPath.join(".")
                                value = deleteKey(value, newPath + ".value")
                                updateParent(value)
                            }
                        }
                    }} error={inputError} onBlur={() => handleInputOnBlur()} onChange={e => handleInputOnChange(e)} value={inputValue === undefined ? defaultValue : inputValue} required={required} fullWidth={true} className={classes.heading} id={field_key} label={field_label} variant="outlined" InputProps={{
                        endAdornment: <InputAdornment position="start">{<MathComponent tex={String.raw`\\${unit}`} />}</InputAdornment>,
                    }} helperText={descriptionText} />
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
                {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} field_enumerate={field_enumerate} enumerated={enumerated} defaultValue={defaultValue} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
            </>
        )
    } else {
        return (
            <>
                <div onMouseEnter={() => {
                    if (inputValue !== undefined & inputValue !== "") {
                        setInputError(false)
                        setDescriptionText(field_description !== undefined ? field_description : "")
                    }
                }} style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                    <TextField size='small'
                        onFocus={() => {
                            if (adamant_error_description !== undefined && adamant_field_error !== undefined) {
                                let cloned = JSON.parse(JSON.stringify(convertedSchema))
                                set(cloned, path + ".adamant_error_description", (field_description !== undefined ? field_description : ""))
                                set(cloned, path + ".adamant_field_error", false)
                                setInputError(false)
                                setDescriptionText(field_description !== undefined ? field_description : "")
                                updateParent(cloned)
                            }
                            if (inputError === true) {
                                setInputValue("")
                                // then delete the value the convertedSchema
                                let value = { ...convertedSchema }
                                if (withinArray === undefined | (withinArray !== undefined & withinArray === true)) {
                                    value = deleteKey(value, path + ".value")
                                    updateParent(value)
                                } else {
                                    let newPath = path.split(".")
                                    newPath.pop()
                                    newPath = newPath.join(".")
                                    value = deleteKey(value, newPath + ".value")
                                    updateParent(value)
                                }
                            }
                        }}
                        error={inputError}
                        helperText={descriptionText}
                        select
                        onBlur={() => handleInputOnBlur()}
                        onChange={e => handleInputOnChange(e)}
                        value={inputValue === undefined ? defaultValue : inputValue}
                        required={required}
                        fullWidth={true}
                        className={classes.heading}
                        id={field_key}
                        label={field_label}
                        variant="outlined"
                        InputProps={{
                            endAdornment: <InputAdornment position="start">{<MathComponent tex={String.raw`\\${unit}`} />}</InputAdornment>,
                        }}
                        SelectProps={{
                            native: true,
                        }}>
                        {
                            field_enumerate.map((content, index) => (
                                <option key={index} value={content}>
                                    {content}
                                </option>
                            ))
                        }
                    </TextField>
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
                {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} field_enumerate={field_enumerate} enumerated={enumerated} defaultValue={defaultValue} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
            </>
        )
    }
};

export default NumberType;
