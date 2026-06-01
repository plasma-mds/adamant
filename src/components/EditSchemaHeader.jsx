import React, { useContext, useState } from 'react'
import TextField from "@material-ui/core/TextField"
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { FormContext } from '../FormContext';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';


const changeKeywords = (convertedSchema, oldKey, desiredNewKey) => {
    if (typeof convertedSchema === 'object' && !Array.isArray(convertedSchema) && convertedSchema !== null) {
        Object.keys(convertedSchema).forEach(keyword => {
            if (keyword === oldKey) {
                let tempValue = convertedSchema[keyword]
                delete convertedSchema[keyword]
                convertedSchema[desiredNewKey] = tempValue
            } else {
                // to maintain the order
                let tempValue = convertedSchema[keyword]
                delete convertedSchema[keyword]
                convertedSchema[keyword] = tempValue
                //
            }
            if (typeof convertedSchema[keyword] === 'object' && !Array.isArray(convertedSchema[keyword]) && convertedSchema[keyword] !== null) {
                changeKeywords(convertedSchema[keyword], oldKey, desiredNewKey)
            }
            else if (Array.isArray(convertedSchema[keyword]) && convertedSchema[keyword] !== null) {
                convertedSchema[keyword].forEach(item => {
                    changeKeywords(item, oldKey, desiredNewKey)
                })
            }
        })
    }
    else if (Array.isArray(convertedSchema) && convertedSchema !== null) {
        convertedSchema.forEach(item => {
            changeKeywords(item, oldKey, desiredNewKey)
        })
    }
}

// Rename array-form items -> prefixItems (2020-12 tuple syntax).
// Only renames when items is an array; single-schema items are left alone.
const itemsToPrefixItems = (schema) => {
    if (typeof schema !== 'object' || schema === null) return;
    if (Array.isArray(schema)) {
        schema.forEach(item => itemsToPrefixItems(item));
        return;
    }
    if (Array.isArray(schema["items"])) {
        schema["prefixItems"] = schema["items"];
        delete schema["items"];
    }
    Object.values(schema).forEach(val => itemsToPrefixItems(val));
};

// Rename prefixItems -> items (2019-09/draft-07 tuple syntax).
const prefixItemsToItems = (schema) => {
    if (typeof schema !== 'object' || schema === null) return;
    if (Array.isArray(schema)) {
        schema.forEach(item => prefixItemsToItems(item));
        return;
    }
    if (schema["prefixItems"] !== undefined) {
        schema["items"] = schema["prefixItems"];
        delete schema["prefixItems"];
    }
    Object.values(schema).forEach(val => prefixItemsToItems(val));
};

// Remove a keyword recursively from the entire schema tree.
const removeKeyword = (schema, key) => {
    if (typeof schema !== 'object' || schema === null) return;
    if (Array.isArray(schema)) {
        schema.forEach(item => removeKeyword(item, key));
        return;
    }
    delete schema[key];
    Object.values(schema).forEach(val => removeKeyword(val, key));
};

const EditSchemaHeader = ({ schemaVersion, title, description, schemaID, openDialog, setOpenDialog }) => {

    const [_schemaVersion, _setSchemaVersion] = useState(schemaVersion);
    const [_title, _setTitle] = useState(title);
    const [_description, _setDescription] = useState(description);
    const [_schemaID, _setSchemaID] = useState(schemaID);
    const { updateParent, convertedSchema, setSchemaSpecification } = useContext(FormContext);


    const allowedSchemaDrafts = [
        "http://json-schema.org/draft-04/schema#",
        "http://json-schema.org/draft-07/schema#",
        "https://json-schema.org/draft/2019-09/schema",
        "http://json-schema.org/draft/2019-09/schema",
        "https://json-schema.org/draft/2020-12/schema",
        "http://json-schema.org/draft/2020-12/schema"
    ]



    // save the change and update the UI
    const handleUpdateSchemaOnClick = () => {
        setSchemaSpecification(_schemaVersion)

        let newSchema = JSON.parse(JSON.stringify(convertedSchema))

        if (_schemaVersion === undefined || _schemaVersion.replace(/\s+/g, '') === "") {
            delete newSchema["$schema"]
        } else {
            newSchema["$schema"] = _schemaVersion
        }

        if (_schemaID === undefined || _schemaID.replace(/\s+/g, '') === "") {
            delete newSchema["id"]
            delete newSchema["$id"]
        } else {
            if (_schemaVersion === "http://json-schema.org/draft-04/schema#") {
                // For draft-04: we want "id" key in the place of "$id" or "id" to maintain the order.
                let orderedSchema = {};
                Object.keys(newSchema).forEach(keyword => {
                    if (keyword === "$id" || keyword === "id") {
                        orderedSchema["id"] = _schemaID;
                    } else {
                        orderedSchema[keyword] = newSchema[keyword];
                    }
                });
                if (orderedSchema["id"] === undefined) {
                    orderedSchema["id"] = _schemaID;
                }
                newSchema = orderedSchema;
            } else {
                // For draft-07/2019-09/2020-12: we want "$id" key in the place of "$id" or "id" to maintain the order.
                let orderedSchema = {};
                Object.keys(newSchema).forEach(keyword => {
                    if (keyword === "$id" || keyword === "id") {
                        orderedSchema["$id"] = _schemaID;
                    } else {
                        orderedSchema[keyword] = newSchema[keyword];
                    }
                });
                if (orderedSchema["$id"] === undefined) {
                    orderedSchema["$id"] = _schemaID;
                }
                newSchema = orderedSchema;
            }
        }

        // Convert dialect-specific keywords when the specification version changes
        const oldSpec = convertedSchema["$schema"] || "";
        const newSpec = _schemaVersion || "";
        const oldIsDraft07OrEarlier = oldSpec.includes("draft-07") || oldSpec.includes("draft-04");
        const oldIs202012 = oldSpec.includes("2020-12");
        const newIsDraft07OrEarlier = newSpec.includes("draft-07") || newSpec.includes("draft-04");
        const newIs202012 = newSpec.includes("2020-12");

        if (oldIsDraft07OrEarlier && !newIsDraft07OrEarlier) {
            // draft-07 → 2019-09 or 2020-12: upgrade vocabulary
            changeKeywords(newSchema, "definitions", "$defs");
            changeKeywords(newSchema, "dependencies", "dependentRequired");
        }
        if (!oldIsDraft07OrEarlier && newIsDraft07OrEarlier) {
            // 2019-09 or 2020-12 → draft-07: downgrade vocabulary
            changeKeywords(newSchema, "$defs", "definitions");
            changeKeywords(newSchema, "dependentRequired", "dependencies");
            removeKeyword(newSchema, "unevaluatedProperties");
        }
        if (!oldIs202012 && newIs202012) {
            // any → 2020-12: rename array-form items to prefixItems
            itemsToPrefixItems(newSchema);
        }
        if (oldIs202012 && !newIs202012) {
            // 2020-12 → any: rename prefixItems back to items
            prefixItemsToItems(newSchema);
        }

        // change id/$id according to the selected schema version
        if (_schemaVersion !== "http://json-schema.org/draft-04/schema#") {
            // change all id's to $id
            if (newSchema["properties"]) {
                changeKeywords(newSchema["properties"], "id", "$id")
            }
        } else {
            //change all $id's to id
            if (newSchema["properties"]) {
                changeKeywords(newSchema["properties"], "$id", "id")
            }
        }

        if (_title === undefined || _title.replace(/\s+/g, '') === "") {
            delete newSchema["title"]
        } else {
            newSchema["title"] = _title
        }

        if (_description === undefined || _description.replace(/\s+/g, '') === "") {
            delete newSchema["description"]
        } else {
            newSchema["description"] = _description
        }

        // better ordering
        let emptyObject = {}
        let emptyArray = []
        Object.keys(newSchema).forEach(keyword=>{
            emptyArray.push(keyword)
        })
        if (emptyArray.includes("$schema")) {
             emptyObject["$schema"] = newSchema["$schema"]
             emptyArray = emptyArray.filter(function(f) {return f !== "$schema"})
        }
        if (emptyArray.includes("$id")) {
             emptyObject["$id"] = newSchema["$id"]
             emptyArray = emptyArray.filter(function(f) {return f !== "$id"})
        }
        if (emptyArray.includes("id")) {
             emptyObject["id"] = newSchema["id"]
             emptyArray = emptyArray.filter(function(f) {return f !== "id"})
        }
        if (emptyArray.includes("title")) {
             emptyObject["title"] = newSchema["title"]
             emptyArray = emptyArray.filter(function(f) {return f !== "title"})
        }
        if (emptyArray.includes("description")) {
             emptyObject["description"] = newSchema["description"]
             emptyArray = emptyArray.filter(function(f) {return f !== "description"})
        }
        if (emptyArray.includes("type")) {
             emptyObject["type"] = newSchema["type"]
             emptyArray = emptyArray.filter(function(f) {return f !== "type"})
        }
        if (emptyArray.includes("properties")){
             emptyObject["properties"] = newSchema["properties"]
             emptyArray = emptyArray.filter(function(f) {return f !== "properties"})
        }
        if (emptyArray.includes("required")){
             emptyObject["required"] = newSchema["required"]
             emptyArray = emptyArray.filter(function(f) {return f !== "required"})
        }

        if (emptyArray.length !== 0) {
             for (let i = 0; i<emptyArray.length; i++){
                 emptyObject[emptyArray[i]] = newSchema[emptyArray[i]]
             }
        }

        updateParent(emptyObject)
        setOpenDialog(false)
    }

    // change descriptor value
    const handleChangeUISchema = (event, keyword) => {

        switch (keyword) {
            case 'title':
                return _setTitle(event.target.value)
            case 'description':
                return _setDescription(event.target.value)
            case 'version':
                return _setSchemaVersion(event.target.value)
            case 'id':
                return _setSchemaID(event.target.value)
            default:
                return null;
        }
    }

    // cancel editing
    const handleCancelEdit = () => {
        _setDescription(description);
        _setSchemaVersion(schemaVersion);
        _setSchemaID(schemaID);
        _setTitle(title);
        setOpenDialog(false)
    }

    return (
        <><Dialog
            open={openDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <EditIcon fontSize="large" color="primary" style={{ alignSelf: "center" }} />
                    <div style={{ width: "100%", alignSelf: "center" }}>
                        Edit schema "{title}"
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
                            <TextField select helperText={"Specification version for this schema. The latest available version is recommended."} margin='normal' onChange={event => handleChangeUISchema(event, "version")} style={{ marginTop: "20px" }} defaultValue={schemaVersion} variant="outlined" fullWidth={true} label={"$schema"} SelectProps={{
                                native: true,
                            }}> {
                                    allowedSchemaDrafts.map((content, index) => (
                                        <option key={index} value={content}>
                                            {content}
                                        </option>
                                    ))
                                }
                            </TextField>
                            <TextField margin='normal' onChange={event => handleChangeUISchema(event, "id")} style={{ marginTop: "10px" }} defaultValue={schemaID} variant="outlined" fullWidth={true} label={"Schema ID"} helperText={"ID or URI for this schema if available."} />
                            <TextField margin='normal' onChange={event => handleChangeUISchema(event, "title")} style={{ marginTop: "10px" }} defaultValue={title} variant="outlined" fullWidth={true} label={"Schema Title"} helperText={"Title of the schema."} />
                            <TextField margin='normal' onChange={event => handleChangeUISchema(event, "description")} style={{ marginTop: "10px" }} defaultValue={description} variant="outlined" fullWidth={true} label={"Schema Description"} multiline rows={3} helperText="Description of the schema. Be more descriptive won't hurt." />
                        </FormControl>
                    </div>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleCancelEdit()} color="secondary">
                    Cancel
                </Button>
                <Button onClick={() => handleUpdateSchemaOnClick()} color="primary" autoFocus>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
        </>

    )
};

export default EditSchemaHeader;