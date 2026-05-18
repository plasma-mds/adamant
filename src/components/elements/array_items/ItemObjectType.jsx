import React, { useEffect, useState, useContext } from 'react'
import { FormContext } from "../../../FormContext";
import ElementRenderer from "../../ElementRenderer";
import Divider from '@material-ui/core/Divider';
import Accordion from "@material-ui/core/Accordion";
import { AccordionDetails, AccordionSummary } from '@material-ui/core';
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Button } from '@material-ui/core';
import DeleteIcon from "@material-ui/icons/Delete";
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import FileIconx from "../../../assets/file-icon.svg"
import { FileIcon, defaultStyles } from 'react-file-icon'
import FileExtensionList from "../../../assets/mime-types-extensions-swapped.json"
import Typography from '@material-ui/core/Typography';
import { Tooltip } from "@material-ui/core";

const ItemObjectType = ({ path, dataInputItems, setDataInputItems, field_label, pathFormData, field_required, field_items, field_type, edit, index, field_key, handleDeleteArrayItem, isResource }) => {
    const [expand, setExpand] = useState(dataInputItems[index]["adamant-ui-specific-expand"] === undefined ? true : dataInputItems[index]["adamant-ui-specific-expand"]); // set to "true" for normally open accordion
    const [useIcon, setUseIcon] = useState(false);
    const [mimeType, setMimeType] = useState("");
    const [fileName, setFileName] = useState("")
    const [extension, setExtension] = useState("")
    const {loadedFiles } = useContext(FormContext)
    let objectIndex = index;
    let field_properties = field_items["properties"]
    let withinArray = true;
    let withinObject = true;


    // This is to expand or contract the accordion, because normally open is used 
    const expandOnChange = () => {
        const value = expand
        setExpand(!value)

        let newVal = [...dataInputItems]
        newVal[index]["adamant-ui-specific-expand"] = !value

        setDataInputItems(newVal)
    };

    // Check if file keyword has some file there
    useEffect(() => {
        if (field_properties["file"] !== undefined) {
            if (field_properties["file"]["value"] !== undefined) {
                if (field_properties["file"]["value"] !== "") {
                    setUseIcon(true);
                    let something = field_properties["file"]["value"].split(";");
                    setFileName(something[1])
                    setMimeType(something[0].replace("fileupload:", ""))//.replace("data:", ""));
                    let ext = something[1].split(".")
                    setExtension(ext.slice(-1)[0])
                }
            }
        }
    }, [field_items])


    //const classes = useStyles();

    return (<>
        <div style={{ width: "100%", padding: "10px 0px 10px 0px" }}>
            <Accordion expanded={expand} >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    style={{ verticalAlign: "middle", height: "10px" }}
                    IconButtonProps={{
                        onClick: expandOnChange
                    }}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        <div style={{ width: "100%", display:"flex", verticalAlign:"middle", lineHeight:"50px" }}>
                            <strong>{field_label + " #" + parseInt(index + 1)}</strong> {isResource && loadedFiles[objectIndex] !== undefined ? <Tooltip placement="top" title={`File is assigned`}><CheckBoxIcon style={{ marginLeft: "10px", height: "100%" }} color="success" /></Tooltip> :  isResource && loadedFiles[objectIndex] === undefined ? <Tooltip placement="top" title={`No file is assigned to this metadata`}><CheckBoxBlankIcon style={{ marginLeft: "10px", height: "100%" }} color="action" /></Tooltip> : null}
                        </div>
                        <div>

                        </div>
                        {edit ? <>
                            <Button onClick={() => handleDeleteArrayItem(index)} style={{ marginLeft: "5px" }}><DeleteIcon color="secondary" /></Button>
                        </> : null}
                    </div>   
                {/*
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        <div style={{ lineHeight: "40px", height: "40px", width: "100%", verticalAlign: "middle" }} >
                            <strong>{field_label + " #" + parseInt(index + 1)}</strong>
                        </div>
                        {useIcon && !expand ? <div style={{ display: "flex", lineHeight: "40px", height: "40px", width: "100%", verticalAlign: "middle" }}>
                            <div style={{ display: "inline-flex", lineHeight: "40px", height: "40px", width: "100%", verticalAlign: "middle" }}>
                                <div style={{ display: "flex", lineHeight: "40px", height: "40px", width: "10%" }}>
                                    <FileIcon size={48} extension={extension} {...defaultStyles[extension]} />
                                </div>
                                <div style={{ width: "50%", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", }}>
                                    {fileName.slice(0, 20) + " | " + mimeType}
                                </div>
                            </div>
                        </div> : <div style={{ width: "100%" }}> </div>}
                        {edit ? <Button onClick={() => handleDeleteArrayItem(index)} style={{ marginLeft: "5px" }}><DeleteIcon color="secondary" /></Button> : null}
                    </div>
                    */}
                </AccordionSummary>
                <Divider />
                <AccordionDetails>
                    <div style={{ width: "100%" }}>
                        {Object.keys(field_properties).map((item, index) => {
                            let tempField = JSON.parse(JSON.stringify(field_properties[item]));
                            if (tempField["enum"]) {
                                tempField["enumerate"] = tempField["enum"]
                            }
                            if (tempField["default"]) {
                                tempField["defaultValue"] = tempField["default"]
                            }
                            return (
                                <div key={item} style={{ display: "flex" }}>
                                    <ElementRenderer withinObject={withinObject} path={path} pathFormData={pathFormData} withinArray={withinArray} dataInputItems={dataInputItems} setDataInputItems={setDataInputItems} fieldkey={item} fieldIndex={objectIndex} elementRequired={field_items["required"]} edit={false} field={tempField} />
                                </div>
                            )
                        })
                        }
                    </div>
                </AccordionDetails>
            </Accordion>
        </div >
    </>);

};

export default ItemObjectType;
