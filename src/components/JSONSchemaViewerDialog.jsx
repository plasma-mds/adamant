import React from "react";
import Divider from '@material-ui/core/Divider';
import { TextField } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import CloseIcon from '@material-ui/icons/Close';


const JSONSchemaViewerDialog = ({ openSchemaViewer, setOpenSchemaViewer, jsonschema }) => {

    return (<>
        <Dialog
            onClose={() => setOpenSchemaViewer(false)}
            maxWidth="md"
            fullWidth={true}
            open={openSchemaViewer}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "30px", width: "100%", alignSelf: "center" }}>
                        JSON Schema viewer
                    </div>
                    <IconButton onClick={() => setOpenSchemaViewer(false)}><CloseIcon fontSize="large" color="secondary" /></IconButton>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <TextField
                    disabled
                    fullWidth={true}
                    variant="filled"
                    multiline
                    defaultValue={JSON.stringify(jsonschema, null, 2)}
                />
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>

        {/*
        <div style={{ width: "100%", padding: "10px 0px 10px 0px" }}>
            <Accordion expanded={expand} >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    IconButtonProps={{
                        onClick: expandOnChange
                    }}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        <div>
                            <Typography className={classes.heading}>JSON Schema Viewer</Typography>
                        </div>
                    </div>
                </AccordionSummary>
                <Divider />
                <AccordionDetails>
                    <div >
                        <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                            {JSON.stringify(jsonschema, null, 2)}
                        </pre>
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
                */}
    </>);
};

export default JSONSchemaViewerDialog;