import React, { useState, useContext } from "react";
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from "@material-ui/icons/Delete";
import { FormContext } from "../../FormContext";
import deleteKey from "../utils/deleteKey";
import EditElement from "../EditElement";
import getValue from "../utils/getValue";
import set from "set-value";
import { Tooltip } from "@material-ui/core";
import { FormControl } from "@material-ui/core";
import { FormLabel } from "@material-ui/core";
import { FormHelperText } from "@material-ui/core";
import { IconButton } from "@material-ui/core";

const AnyOfKeywordPlaceHolder = ({ pathFormData, path, field_required, field_uri, field_key, field_index, edit, field_label, field_description, field_prefixItems, anyOf_list }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const { updateParent, convertedSchema, handleDataDelete } = useContext(FormContext);

    let field_items = {}

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

    var required;
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
        "items": field_items,
        "type": "anyOf",
    }

    return (<>
        <div style={{ paddingTop: "10px", paddingLeft: "15px", width: "100%" }}>
            <FormControl style={{ display: "inline-flex", width: "100%" }}>
                <FormLabel style={{ display: "inline-flex", width: "100%" }}>{field_label === undefined ? "" : field_label + ":"}</FormLabel>
                <div style={{ display: "inline-flex", width: "100%" }}>
                    <div style={{ paddingTop: "15px", textAlign: "left", width: "100%" }}>
                        "AnyOf" keyword is not yet implemented.
                    </div>
                    <div style={{ display: "inline-flex", width: "100%", justifyContent: "right" }}>
                        {edit ? <>
                            <Tooltip placement="top" title={`Edit "${field_label}"`}>
                                <IconButton onClick={() => setOpenDialog(true)} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}><EditIcon fontSize="small" color="primary" /></IconButton>
                            </Tooltip>
                            <Tooltip placement="top" title={`Remove "${field_label}"`}>
                                <IconButton onClick={() => handleDeleteElement()} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}><DeleteIcon fontSize="small" color="secondary" /></IconButton>
                            </Tooltip>
                        </> : null}
                    </div>
                </div>
                <FormHelperText>{field_description}</FormHelperText>
            </FormControl>
        </div>
        {openDialog ? <EditElement field_uri={field_uri} anyOf_list={anyOf_list} pathFormData={pathFormData} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
    </>
    );
};

export default AnyOfKeywordPlaceHolder;