import React, { useState, useContext } from "react";
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from "@material-ui/icons/Delete";
import { FormContext } from "../../FormContext";
import deleteKey from "../utils/deleteKey";
import EditElement from "../EditElement";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { TextField } from "@material-ui/core";
import ElementRenderer from "../ElementRenderer";
import getValue from "../utils/getValue";
import isFieldRequired from "../utils/isFieldRequired";
import set from "set-value";
import { Tooltip } from "@material-ui/core";
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';

const useStyles = makeStyles((theme) => ({
    heading: {
        color: 'rgba(82, 94, 103, 1)',
        fontSize: theme.typography.pxToRem(25),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));

const Accordion = withStyles({
    root: {
        border: '1px solid rgba(232, 244, 253, 1)',
        '&:not(:last-child)': { borderBottom: 0 },
        boxShadow: "none",
        '&:before': { display: 'none' },
        '&$expanded': { margin: 'auto' },
    },
    expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: 'rgba(232, 244, 253, 1)',
        borderBottom: '1px solid rgba(0, 0, 0, .0)',
        marginBottom: -1,
        minHeight: 56,
        '&$expanded': { minHeight: 56 },
    },
    content: { '&$expanded': { margin: '12px 0' } },
    expanded: {},
})(MuiAccordionSummary);

const AnyOfKeyword = ({ pathFormData, path, field_required, field_uri, field_key, field_index, edit, field_label, field_description, anyOf_list }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [expand, setExpand] = useState(true);
    const [globalIndex, setGlobalIndex] = useState(0);
    const { updateParent, convertedSchema, handleDataDelete } = useContext(FormContext);
    const classes = useStyles();

    // clean up empty path segments
    path = path.split(".").filter(Boolean).join(".");
    pathFormData = pathFormData.split(".").filter(Boolean).join(".");

    // one level up — needed to pass correct path to ElementRenderer
    const parentPath = path.split(".").slice(0, -1).join(".");
    const parentPathFormData = pathFormData.split(".").slice(0, -1).join(".");

    const required = isFieldRequired(field_required, field_key);

    const handleChooseAnyOfSchema = (event) => {
        const index = parseInt(event.target.value);
        // clear stored value and any type/properties left from the previous variant
        handleDataDelete(pathFormData);
        const node = getValue(convertedSchema, path);
        if (node) {
            delete node.value;
            delete node.type;
            delete node.properties;
            set(convertedSchema, path, node);
            updateParent(convertedSchema);
        }
        setGlobalIndex(index);
    };

    const handleDeleteElement = () => {
        let value = deleteKey(convertedSchema, path);
        const pathArr = path.split(".");
        const targetRequired = pathArr.length <= 2
            ? value
            : getValue(value, pathArr.slice(0, -2).join("."));
        if (targetRequired?.required !== undefined) {
            const idx = targetRequired.required.indexOf(field_key);
            if (idx !== -1) {
                targetRequired.required.splice(idx, 1);
                if (targetRequired.required.length === 0) {
                    delete targetRequired.required;
                }
            }
        }
        updateParent(value);
        handleDataDelete(pathFormData);
    };

    const UISchema = {
        fieldKey: field_key,
        title: field_label,
        description: field_description,
        $id: field_uri,
        type: "anyOf",
    };

    // Build the field object for the selected variant.
    // fieldKey is required so ElementRenderer and its children can identify the field.
    const activeSchema = { ...(anyOf_list[globalIndex] ?? {}), fieldKey: field_key };

    return (
        <>
            <div style={{ width: "100%", padding: "10px 0px 10px 0px" }}>
                <Accordion expanded={expand}>
                    <AccordionSummary
                        expandIcon={
                            <Tooltip placement="top" title="Collapse/Expand this container">
                                <ExpandMoreIcon />
                            </Tooltip>
                        }
                        aria-controls="anyof-content"
                        id="anyof-header"
                        IconButtonProps={{ onClick: () => setExpand(v => !v) }}
                    >
                        <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                            <div style={{ width: "100%" }}>
                                <Typography className={classes.heading}>
                                    {field_label + (required ? "*" : "")}
                                </Typography>
                                {expand && <div style={{ color: "gray" }}>{field_description}</div>}
                            </div>
                            {edit && <>
                                <Tooltip placement="top" title={`Edit "${field_label}"`}>
                                    <Button onClick={() => setOpenDialog(true)} style={{ marginLeft: "5px" }}>
                                        <EditIcon color="primary" />
                                    </Button>
                                </Tooltip>
                                <Tooltip placement="top" title={`Remove "${field_label}"`}>
                                    <Button onClick={handleDeleteElement} style={{ marginLeft: "5px" }}>
                                        <DeleteIcon color="secondary" />
                                    </Button>
                                </Tooltip>
                            </>}
                        </div>
                    </AccordionSummary>
                    <Divider />
                    <MuiAccordionDetails style={{ flexDirection: "column" }}>
                        <TextField
                            onChange={handleChooseAnyOfSchema}
                            style={{ width: "220px", marginTop: "10px" }}
                            select
                            label="Choose a subschema"
                            SelectProps={{ native: true }}
                            variant="outlined"
                            size="small"
                        >
                            {anyOf_list.map((schema, index) => (
                                <option key={index} value={index}>
                                    {schema?.title || schema?.type || `Option ${index + 1}`}
                                </option>
                            ))}
                        </TextField>
                        <div style={{ paddingTop: "10px" }}>
                            <ElementRenderer
                                pathFormData={parentPathFormData}
                                path={parentPath}
                                fieldkey={field_key}
                                fieldIndex={field_index}
                                elementRequired={field_required}
                                edit={false}
                                field={activeSchema}
                            />
                        </div>
                    </MuiAccordionDetails>
                </Accordion>
            </div>
            {openDialog && (
                <EditElement
                    field_uri={field_uri}
                    anyOf_list={anyOf_list}
                    pathFormData={pathFormData}
                    field_key={field_key}
                    field_index={field_index}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    path={path}
                    UISchema={UISchema}
                    field_required={required}
                />
            )}
        </>
    );
};

export default AnyOfKeyword;
