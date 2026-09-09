import React, { useState } from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from "@material-ui/core/Button";
import { Checkbox, FormControlLabel, Radio, RadioGroup, TextField } from "@material-ui/core";

// Single connect entry point for eLabFTW: offers a choice between the institution's
// pre-configured instance and a custom instance, but only one of the two can ever be
// the active connection at a time - see AdamantMain.jsx's mutual-exclusion handling.
const ELabFTWLoginDialog = ({
    open, setOpen,
    email, setEmail, token, setToken, remember, setRemember, handleLogin,
    externalElabUrl, setExternalElabUrl, externalEmail, setExternalEmail, externalToken, setExternalToken, externalRemember, setExternalRemember, handleExternalLogin,
}) => {
    const [mode, setMode] = useState("internal");
    const isExternal = mode === "external";

    const handleContinue = () => {
        if (isExternal) { handleExternalLogin(); } else { handleLogin(); }
    };

    const handleKeypress = (event) => {
        if (event.charCode === 13) { handleContinue(); }
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
                        Connect with eLabFTW
                    </div>
                </div>
                <div style={{ padding: "10px" }}>
                    <Divider />
                </div>
                <RadioGroup value={mode} onChange={(event) => setMode(event.target.value)}>
                    <FormControlLabel value="internal" control={<Radio color="primary" />} label="This institution's eLabFTW" />
                    <FormControlLabel value="external" control={<Radio color="primary" />} label="A different eLabFTW instance" />
                </RadioGroup>
                {isExternal ? (
                    <TextField fullWidth={true} margin="normal" label="eLabFTW instance URL" placeholder="https://demo.elabftw.net" onChange={(event) => setExternalElabUrl(event.target.value)} value={externalElabUrl} onKeyPress={(event) => handleKeypress(event)} />
                ) : null}
                <TextField fullWidth={true} margin="normal" label="Email" type="email" autoComplete="email" onChange={(event) => (isExternal ? setExternalEmail : setEmail)(event.target.value)} value={isExternal ? externalEmail : email} onKeyPress={(event) => handleKeypress(event)} />
                <TextField fullWidth={true} margin="normal" label="Token" type="password" autoComplete="current-password" onChange={(event) => (isExternal ? setExternalToken : setToken)(event.target.value)} value={isExternal ? externalToken : token} onKeyPress={(event) => handleKeypress(event)} />
                <div style={{ paddingBottom: "20px", color: "gray" }}>If you do not yet have an eLabFTW API token/key: first log in to {isExternal ? "that eLabFTW instance" : "your eLabFTW"} and generate the API key/token. <a href="https://doc.elabftw.net/api.html" target="_blank">More info</a>.</div>
                <FormControlLabel
                    control={<Checkbox checked={isExternal ? externalRemember : remember} onChange={(event) => (isExternal ? setExternalRemember : setRemember)(event.target.checked)} color="primary" />}
                    label="Remember me on this device"
                />
                <div style={{
                    display: "flex",
                    justifyContent: "right",
                }}>
                    <Button style={{ margin: "5px" }} variant="outlined" color="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button style={{ margin: "5px" }} variant="contained" color="primary" onClick={() => handleContinue()}>Continue</Button>
                </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default ELabFTWLoginDialog;
