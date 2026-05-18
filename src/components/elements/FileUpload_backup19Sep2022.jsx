import React, { useContext, useEffect, useState, useCallback } from 'react'
import { FormLabel, FormHelperText, FormControl } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButton, Button } from '@material-ui/core';
import EditElement from '../EditElement';
import { FormContext } from '../../FormContext';
import deleteKey from '../utils/deleteKey';
import { Tooltip } from '@material-ui/core';
import getValue from '../utils/getValue';
import set from 'set-value';
import { useDropzone } from "react-dropzone";
import LinearProgress from '@mui/material/LinearProgress';
import Box from "@material-ui/core/Box";
import NotRenderable from "../../assets/not-renderable.png"
import FileIcon from "../../assets/file-icon.svg"

const getAcceptedTypes = (field_description) => {
    let matches = field_description.match(/\[(.*?)\]/);

    if (matches) {
        let submatch = matches[1];
        submatch = submatch.replaceAll("\"", "")
        submatch = submatch.replaceAll(" ", "")
        submatch = submatch.split(",")
        return submatch
    } else {
        return []
    }
}


const validateAcceptedFile = (fileType, acceptedTypes) => {
    fileType = fileType.split(".")
    fileType = fileType.pop()
    fileType = "." + fileType

    if (acceptedTypes.includes(fileType)) {
        return true
    } else {
        return false
    }
}


const FileUpload = ({ adamant_field_error, adamant_error_description, contentEncoding, withinObject, field_uri, dataInputItems, setDataInputItems, withinArray, path, pathFormData, field_required, field_index, edit, field_key, field_label, field_description, field_enumerate, defaultValue, value }) => {

    const [openDialog, setOpenDialog] = useState(false);
    const { handleLoadedFiles, updateParent, convertedSchema, handleDataDelete, handleConvertedDataInput } = useContext(FormContext);
    const [inputError, setInputError] = useState(false)
    //const [descriptionText, setDescriptionText] = useState(field_description !== undefined ? field_description : "");
    const [descriptionText, setDescriptionText] = useState()
    const [dataUrl, setDataUrl] = useState(defaultValue !== undefined ? defaultValue : value !== undefined ? value : "")
    const [renderingInProgress, setRenderingInProgress] = useState(false)
    const [mediaFileType, setMediaFileType] = useState("")
    const [fileSize, setFileSize] = useState();
    //const [required, setRequired] = useState(false)

    // update description text state as soon as new field description is obtained
    useEffect(() => {
        // check media file type
        if (value !== undefined && typeof value === 'string') {
            if (value.includes(";base64")) {
                setMediaFileType(value.split(";")[0].replace("data:", ""))
            }
            else {
                setMediaFileType("")
                setDataUrl("")
                value = ""
                defaultValue = ""
            }
        } else {
            setMediaFileType("")
            setDataUrl("")
            value = ""
            defaultValue = ""
        }

        if (adamant_error_description !== undefined) {
            setDescriptionText(adamant_error_description)
        }
        else if (field_description !== undefined) {
            setDescriptionText(field_description)
        }
        else {
            setDescriptionText("")
        }

    }, [field_description, dataUrl])

    // max. allowed fileupload size
    let allowedFileSize = 500000

    // for visual feedback on the field after validation
    useEffect(() => {
        setInputError(adamant_field_error !== undefined ? adamant_field_error : false)
        setDescriptionText(adamant_error_description !== undefined ? adamant_error_description : field_description !== undefined ? field_description : "")
    }, [adamant_error_description, adamant_field_error])

    // define a list of renderable media file types
    let renderableMediaFileTypes = ["image/jpeg", "image/png", "image/bmp", "image/tiff", "image/svg+xml"]

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

    // visualize that the field is required
    let fieldLabel = field_label;
    if (required === true) {
        fieldLabel += "*"
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

    // browse or drag&drop file
    const onDrop = useCallback(
        (acceptedFile) => {
            let acceptedTypes = getAcceptedTypes(field_description);
            let valid = true
            if (acceptedTypes.length === 0) {
                valid = true
            } else {
                valid = validateAcceptedFile(acceptedFile[0]["name"], acceptedTypes)
                if (!valid) {
                    setDescriptionText("Seems like you've given a file with an unaccepted file type?")
                }
            }
            // only accept file lower than allowedFileSize
            //if (acceptedFile[0]["size"] > allowedFileSize) {
            //    valid = false;
            //    setDescriptionText(`File size is too big. The file size should not exceed ${allowedFileSize / 1000} KB.`)
            //}
            if (valid) {
                console.log(acceptedFile)
                handleLoadedFiles(acceptedFile)
                setRenderingInProgress(true)
                setFileSize(acceptedFile[0]["size"])
                // process the schema, validation etc
                // read file and update receivedData
                const reader = new FileReader();
                reader.onabort = () => console.log("file reading was aborted");
                reader.onerror = () => console.log("file reading has failed");
                reader.onload = () => {
                    const binaryStr = reader.result;
                    setDataUrl(binaryStr)
                    //console.log(acceptedFile[0]["path"])
                    //setDataUrl(acceptedFile[0])
                    setMediaFileType(acceptedFile[0]["type"])
                    if (withinArray !== undefined & withinArray) {
                        let newPathFormData = pathFormData.split(".");
                        newPathFormData.pop()
                        newPathFormData = newPathFormData.join(".")

                        let newPath = path.split(".")
                        newPath.pop()
                        newPath = newPath.join(".")

                        let arr = dataInputItems;
                        const items = Array.from(arr);
                        items[field_index][field_key] = binaryStr;
                        //items[field_index][field_key] = acceptedFile[0];
                        setDataInputItems(items);
                        handleConvertedDataInput(items, newPath + ".value", "boolean")

                        setRenderingInProgress(false)
                    } else {
                        handleConvertedDataInput(binaryStr, path + ".value", "boolean")
                        //handleConvertedDataInput(acceptedFile[0], path + ".value", "boolean")

                        setRenderingInProgress(false)
                    }
                }
                reader.readAsDataURL(acceptedFile[0]);
            } else {
                setRenderingInProgress(false)
                setInputError(true)
                setDataUrl("")
                setMediaFileType("")
            }
        },
        []
    );
    //


    // update this field input value everytime the value changes. E.g., when autofilling or first render of the field when defaultvalue exists 
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

            //if (Array.isArray(latestVal)) { latestVal = latestVal[field_key] }
            let dataInputItemVal = "";
            if (items.length !== 0) {
                if (typeof (items[0]) === "object") {
                    dataInputItemVal = items[field_index][field_key]
                }
            }
            let val = (value !== undefined ? value : defaultValue !== undefined ? defaultValue : dataInputItemVal !== undefined ? dataInputItemVal : "")
            if (val === "") {
                setDataUrl("")
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
            }
            else {
                if (withinObject) {
                    // if withinArray and withinObject skip setDataInputItems etc
                    setDataUrl(val)
                } else {
                    items[field_index][field_key] = val;
                    setDataInputItems(items);

                    setDataUrl(val)
                    setInputError(false)
                    setDescriptionText(field_description !== undefined ? field_description : "")

                    handleConvertedDataInput(items, newPath + ".value", "boolean")
                }
            }
        }
        else {
            let val = (value !== undefined ? value : defaultValue !== undefined ? defaultValue : "")
            if (val === "") {
                setDataUrl("")
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")
            }
            else {
                setDataUrl(val)
                setInputError(false)
                setDescriptionText(field_description !== undefined ? field_description : "")

                handleConvertedDataInput(val, path + ".value", "boolean")
            }
        }
    }, [value])

    // construct UI schema
    let UISchema = {
        "fieldKey": field_key,
        "title": field_label,
        "description": field_description,
        "$id": field_uri,
        "type": "fileupload (string)",
        "value": value,
    }

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: false,
    });

    const handleOnClickedClear = () => {
        setMediaFileType("")
        setDataUrl("")
        setFileSize()
        // then delete in the form convdata
        if (withinArray !== undefined & withinArray) {
            let newPathFormData = pathFormData.split(".");
            newPathFormData.pop()
            newPathFormData = newPathFormData.join(".")

            let newPath = path.split(".")
            newPath.pop()
            newPath = newPath.join(".")

            let arr = dataInputItems;
            const items = Array.from(arr);
            items[field_index][field_key] = undefined;
            setDataInputItems(items);
            handleConvertedDataInput(items, newPath + ".value", "boolean")
        } else {
            handleConvertedDataInput("", path + ".value", "boolean")
        }
    }

    return (
        <>
            <div onClick={() => {
                if (adamant_error_description !== undefined && adamant_field_error !== undefined) {
                    set(convertedSchema, path + ".adamant_error_description", (field_description !== undefined ? field_description : ""))
                    set(convertedSchema, path + ".adamant_field_error", false)
                    setInputError(false)
                    setDescriptionText(field_description !== undefined ? field_description : "")

                    updateParent(convertedSchema)
                }
                if (inputError === true) {
                    setInputError(false)
                    setDescriptionText(field_description !== undefined ? field_description : "")

                    // then delete the value the convertedSchema
                }
            }} style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', alignItems: "center", width: '100%' }}>
                <div style={{ paddingLeft: "15px", width: "100%" }}>
                    <FormControl >
                        <FormLabel style={{ paddingBottom: "10px", color: `${inputError ? "red" : ""}` }}>{fieldLabel === undefined ? + "" : fieldLabel + ":"}</FormLabel>
                        {renderingInProgress ? <Box sx={{ width: '225px' }}>
                            <LinearProgress />
                        </Box> : null}
                        <div style={{ width: "225px", display: "flex", justifyContent: "center" }}>
                            {dataUrl !== "" ? <img alt='fileUpload' src={renderableMediaFileTypes.includes(mediaFileType) ? dataUrl : FileIcon} width={renderableMediaFileTypes.includes(mediaFileType) ? "225" : "64"} /> : ""}
                        </div>
                        <div style={{ width: "225px", fontSize: "10px", color: "grey", paddingTop: "5px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {dataUrl}
                        </div>
                        <div style={{ width: "225px", fontSize: "10px", color: "grey", paddingTop: "5px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {fileSize !== undefined ? `size: ${fileSize / 1000} KB` : null}
                        </div>
                        <div style={{ paddingTop: "5px", textAlign: "left", width: "100%" }} >
                            <Button color={inputError ? "secondary" : "default"} variant="outlined" {...getRootProps()} ><input {...getInputProps()} />Upload a file</Button>
                            {dataUrl !== "" ? <Button onClick={() => { handleOnClickedClear() }} style={{ marginLeft: "5px" }} variant="outlined" color="secondary">Clear</Button> : null}
                        </div>
                        <FormHelperText style={{ color: `${inputError ? "red" : ""}` }}>{descriptionText}</FormHelperText>
                    </FormControl>
                </div>
                {
                    edit ? <>
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
                    </> : null
                }
            </div >
            {openDialog ? <EditElement field_uri={field_uri} pathFormData={pathFormData} defaultValue={defaultValue} field_key={field_key} field_index={field_index} openDialog={openDialog} setOpenDialog={setOpenDialog} path={path} UISchema={UISchema} field_required={required} /> : null}
        </>
    )
};

export default FileUpload;
