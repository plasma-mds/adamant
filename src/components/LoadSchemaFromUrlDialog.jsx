import React from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from "@material-ui/core/Button";
import { TextField } from "@material-ui/core";

const LoadSchemaFromUrlDialog = ({ open, setOpen, url, setUrl, onSubmit }) => {

    const handleKeypress = (event) => {
        if (event.charCode === 13) { onSubmit(); }
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
                        Load schema from URL
                    </div>
                </div>
                <div style={{ padding: "10px" }}>
                    <Divider />
                </div>
                <TextField
                    fullWidth={true}
                    margin="normal"
                    label="JSON schema URL"
                    placeholder="https://example.com/schema.json"
                    onChange={(event) => setUrl(event.target.value)}
                    value={url}
                    onKeyPress={(event) => handleKeypress(event)}
                />
                <div style={{
                    display: "flex",
                    justifyContent: "right",
                }}>
                    <Button style={{ margin: "5px" }} variant="outlined" color="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button style={{ margin: "5px" }} variant="contained" color="primary" onClick={() => onSubmit()}>Continue</Button>
                </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default LoadSchemaFromUrlDialog;
