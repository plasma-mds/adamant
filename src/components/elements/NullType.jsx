import React, { useContext, useState, useEffect } from 'react'
import { FormLabel, FormHelperText, FormControl } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButton } from '@material-ui/core';
import EditElement from '../EditElement';
import { FormContext } from '../../FormContext';
import deleteKey from '../utils/deleteKey';
import { Tooltip } from '@material-ui/core';
import getValue from '../utils/getValue';
import set from 'set-value';

const NullType = ({ field_uri, withinArray, withinObject, dataInputItems, setDataInputItems, path, pathFormData, field_required, field_index, edit, field_key, field_label, field_description }) => {
    const [descriptionText, setDescriptionText] = useState()
    const [openDialog, setOpenDialog] = useState(false);
    const { updateParent, convertedSchema, handleDataDelete, handleConvertedDataInput } = useContext(FormContext);

    useEffect(() => {
        setDescriptionText(field_description !== undefined ? field_description : "")
    }, [field_description])

    // register null value in form data on mount
    useEffect(() => {
        handleConvertedDataInput(null, path + ".value", "null")
    }, [])

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

    let UISchema = {
        "fieldKey": field_key,
        "title": field_label,
        "description": field_description,
        "$id": field_uri,
        "type": "null",
        "value": null
    }

    const handleDeleteElement = () => {
        let value = deleteKey(convertedSchema, path)
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

    return (
        <>
            <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', alignItems: "center", width: '100%' }}>
                <div style={{ paddingLeft: "15px", width: "100%" }}>
                    <FormControl>
                        <FormLabel>{field_label === undefined ? "" : field_label + (required ? " *" : "") + ":"}</FormLabel>
                        <div style={{ color: "gray", fontSize: "11pt", paddingTop: "4px", fontStyle: "italic" }}>null</div>
                        <FormHelperText>{descriptionText}</FormHelperText>
                    </FormControl>
                </div>
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
            {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
        </>
    )
};

export default NullType;
