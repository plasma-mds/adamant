import React from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from "@material-ui/core/Button";
import { TextField } from "@material-ui/core";

const NextCloudUploadFilenameDialog = ({ open, setOpen, filename, setFilename, schemaFilename, setSchemaFilename, onConfirm }) => {

    const handleKeypress = (event) => {
        if (event.charCode === 13) { onConfirm(); }
    };

    return (<>
        <Dialog
            onClose={() => setOpen(false)}
            maxWidth="xs"
            fullWidth={false}
            open={open}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            onKeyPress={(event) => handleKeypress(event)}
        >
            <DialogContent>
                <div style={{ display: "flex" }}>
                    <div style={{ width: "360px", fontSize: "20px", padding: "10px" }}>
                        Confirm the file names
                    </div>
                </div>
                <div style={{ padding: "10px" }}>
                    <Divider />
                </div>
                <div style={{ paddingBottom: "10px", color: "gray" }}>Edit the filenames below if you'd like different names.</div>
                <TextField fullWidth={true} margin="normal" label="File name" onChange={(event) => setFilename(event.target.value)} value={filename} onKeyPress={(event) => handleKeypress(event)} />
                <div style={{ paddingBottom: "10px", color: "gray" }}>Schema file name, saved alongside it. Follows the file name above unless edited directly.</div>
                <TextField fullWidth={true} margin="normal" label="Schema file name" onChange={(event) => setSchemaFilename(event.target.value)} value={schemaFilename} onKeyPress={(event) => handleKeypress(event)} />
                <div style={{
                    display: "flex",
                    justifyContent: "right",
                }}>
                    <Button style={{ margin: "5px" }} variant="outlined" color="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button style={{ margin: "5px" }} variant="contained" color="primary" disabled={filename.trim() === "" || schemaFilename.trim() === ""} onClick={() => onConfirm()}>Upload</Button>
                </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default NextCloudUploadFilenameDialog;
