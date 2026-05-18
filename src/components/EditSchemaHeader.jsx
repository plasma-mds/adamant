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

const EditSchemaHeader = ({ schemaVersion, title, description, schemaID, openDialog, setOpenDialog }) => {

    const [_schemaVersion, _setSchemaVersion] = useState(schemaVersion);
    const [_title, _setTitle] = useState(title);
    const [_description, _setDescription] = useState(description);
    const [_schemaID, _setSchemaID] = useState(schemaID);
    const { updateParent, convertedSchema, setSchemaSpecification } = useContext(FormContext);


    const allowedSchemaDrafts = ["http://json-schema.org/draft-04/schema#", "http://json-schema.org/draft-07/schema#"]



    // save the change and update the UI
    const handleUpdateSchemaOnClick = () => {
        setSchemaSpecification(_schemaVersion)

        if (_schemaVersion === undefined) {
            delete convertedSchema["$schema"]
        } else if (_schemaVersion.replace(/\s+/g, '') === "") {
            delete convertedSchema["$schema"]
        } else {
            convertedSchema["$schema"] = _schemaVersion
        };

        if (_schemaID === undefined) {
            delete convertedSchema["id"]
            delete convertedSchema["$id"]
        } else if (_schemaID.replace(/\s+/g, '') === "") {
            delete convertedSchema["id"]
            delete convertedSchema["$id"]
        } else {
            if (_schemaVersion === "http://json-schema.org/draft-04/schema#") {
                Object.keys(convertedSchema).forEach(keyword => {
                    if (keyword === "$id" & convertedSchema["$id"] !== undefined) {
                        delete convertedSchema["$id"]
                        convertedSchema["id"] = _schemaID
                    }
                    else if (keyword === "id" & convertedSchema["id"] !== undefined) {
                        delete convertedSchema["id"]
                        convertedSchema["$id"] = _schemaID
                    }
                    else if (convertedSchema["$id"] === undefined) {
                        convertedSchema["id"] = _schemaID
                    }  
                    else {
                        // to maintain the order
                        let tempValue = convertedSchema[keyword]
                        delete convertedSchema[keyword]
                        convertedSchema[keyword] = tempValue
                        //
                    }
                })
            } else {
                Object.keys(convertedSchema).forEach(keyword => {
                    if (keyword === "id" & convertedSchema["id"] !== undefined) {
                        delete convertedSchema["id"]
                        convertedSchema["$id"] = _schemaID
                    }
                    else if (keyword === "$id" & convertedSchema["$id"] !== undefined) {
                        delete convertedSchema["$id"]
                        convertedSchema["id"] = _schemaID
                    }
                    else if (convertedSchema["id"] === undefined) {
                        convertedSchema["$id"] = _schemaID
                    }
                    else {
                        // to maintain the order
                        let tempValue = convertedSchema[keyword]
                        delete convertedSchema[keyword]
                        convertedSchema[keyword] = tempValue
                        //
                    }
                })
            }
        };

        // change id/$id according to the selected schema version 
        if (_schemaVersion !== "http://json-schema.org/draft-04/schema#") {
            // change all id's to $id
            changeKeywords(convertedSchema["properties"], "id", "$id")
        } else {
            //change all $id's to id
            changeKeywords(convertedSchema["properties"], "$id", "id")
        }

        if (_title === undefined) {
            delete convertedSchema["title"]
        } else if (_title.replace(/\s+/g, '') === "") {
            delete convertedSchema["title"]
        } else {
            convertedSchema["title"] = _title
        };

        if (_description === undefined) {
            delete convertedSchema["description"]
        } else if (_description.replace(/\s+/g, '') === "") {
            delete convertedSchema["description"]
        } else {
            convertedSchema["description"] = _description
        };

        // better ordering
        let emptyObject = {}
        let emptyArray = []
        Object.keys(convertedSchema).forEach(keyword=>{
            emptyArray.push(keyword)
        })
        if (emptyArray.includes("$schema")) {
             emptyObject["$schema"] = convertedSchema["$schema"]
             emptyArray = emptyArray.filter(function(f) {return f !== "$schema"})
        }
        if (emptyArray.includes("$id")) {
            emptyObject["$id"] = convertedSchema["$id"]
            emptyArray = emptyArray.filter(function(f) {return f !== "$id"})
        }
        if (emptyArray.includes("id")) {
            emptyObject["id"] = convertedSchema["id"]
            emptyArray = emptyArray.filter(function(f) {return f !== "id"})
        }
        if (emptyArray.includes("title")) {
            emptyObject["title"] = convertedSchema["title"]
            emptyArray = emptyArray.filter(function(f) {return f !== "title"})
        }
        if (emptyArray.includes("description")) {
            emptyObject["description"] = convertedSchema["description"]
            emptyArray = emptyArray.filter(function(f) {return f !== "description"})
        }
        if (emptyArray.includes("type")) {
            emptyObject["type"] = convertedSchema["type"]
            emptyArray = emptyArray.filter(function(f) {return f !== "type"})
        }
        if (emptyArray.includes("properties")){
            emptyObject["properties"] = convertedSchema["properties"]
            emptyArray = emptyArray.filter(function(f) {return f !== "properties"})
        }
        if (emptyArray.includes("required")){
            emptyObject["required"] = convertedSchema["required"]
            emptyArray = emptyArray.filter(function(f) {return f !== "required"})
        }

        if (emptyArray.length !== 0) {
            for (let i = 0; i<emptyArray.length; i++){
                emptyObject[emptyArray[i]] = convertedSchema[emptyArray[i]]
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