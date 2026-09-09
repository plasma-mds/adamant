import React from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from "@material-ui/core/Button";
import { Checkbox, FormControlLabel, IconButton, TextField, Tooltip } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/HelpOutlineRounded";

const NextCloudLoginDialog = ({ openNextCloudLoginDialog, setOpenNextCloudLoginDialog, ncUsername, setNcUsername, ncAppPassword, setNcAppPassword, remember, setRemember, handleNextCloudLogin }) => {

    const handleKeypress = (event) => {
        if (event.charCode === 13) { handleNextCloudLogin(); }
    };

    return (<>
        <Dialog
            onClose={() => setOpenNextCloudLoginDialog(false)}
            maxWidth="xs"
            fullWidth={false}
            open={openNextCloudLoginDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            onKeyPress={(event) => handleKeypress(event)}
        >
            <DialogContent>
                <div style={{ display: "flex" }}>
                    <div style={{ width: "360px", fontSize: "20px", padding: "10px" }}>
                        Connect with NextCloud
                    </div>
                </div>
                <div style={{ padding: "10px" }}>
                    <Divider />
                </div>
                <TextField fullWidth={true} margin="normal" label="Username" autoComplete="username" onChange={(event) => setNcUsername(event.target.value)} value={ncUsername} onKeyPress={(event) => handleKeypress(event)} />
                <div style={{ display: "flex", alignItems: "center" }}>
                    <TextField fullWidth={true} margin="normal" label="App Password" type="password" autoComplete="current-password" onChange={(event) => setNcAppPassword(event.target.value)} value={ncAppPassword} onKeyPress={(event) => handleKeypress(event)} />
                    <Tooltip
                        placement="top"
                        title={<div style={{ fontSize: "14px" }}>Do not use your regular account password. In NextCloud, go to Settings &gt; Security &gt; Devices &amp; sessions, give it a name (e.g. "Adamant") and click "Create new app password". Use the generated password here.</div>}
                    >
                        <IconButton size="small"><HelpIcon /></IconButton>
                    </Tooltip>
                </div>
                <FormControlLabel
                    control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} color="primary" />}
                    label="Remember me on this device"
                />
                <div style={{
                    display: "flex",
                    justifyContent: "right",
                }}>
                    <Button style={{ margin: "5px" }} variant="outlined" color="secondary" onClick={() => setOpenNextCloudLoginDialog(false)}>Cancel</Button>
                    <Button style={{ margin: "5px" }} variant="contained" color="primary" onClick={() => handleNextCloudLogin()}>Continue</Button>
                </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default NextCloudLoginDialog;
