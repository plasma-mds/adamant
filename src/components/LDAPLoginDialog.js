import React from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from "@material-ui/core/Button";
import { Route } from 'react-router-dom'
import { TextField, Tooltip } from "@material-ui/core";
import AdamantHeader from "../assets/adamant-header-5.svg"

const LDAPLoginDialog = ({ openLDAPLoginDialog, setOpenLDAPLoginDialog, setIntranetUsername, setUserPassword, token, setToken, email, setEmail, handleLogin }) => {

    //onClose={() => setOpenUseCasesDialog(false)}

    const handleKeypress = (event) => {      //it triggers by pressing the enter key
        if (event.charCode === 13) { handleLogin();    }  
    };

    return (<>
        <Dialog
            onClose={() => setOpenLDAPLoginDialog(false)}
            maxWidth="xs"
            fullWidth={false}
            open={openLDAPLoginDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            onKeyPress={(event) => handleKeypress(event)}
        >
            {/*
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "30px", width: "100%", alignSelf: "center" }}>
                        What would you like to do?
                    </div>
                    <IconButton onClick={() => setOpenUseCasesDialog(false)}><CloseIcon fontSize="large" color="secondary" /></IconButton>
                </div>
            </DialogTitle>
            <Divider />
            */}
            <DialogContent>
                <div style={{display: "flex"}}>
                    <div style={{width:"360px", fontSize: "20px", padding: "10px" }}>
                    Log in using your eLabFTW Token
                    </div>
                </div>
                <div style={{ padding: "10px" }}>
                    <Divider />
                </div>
                    {/*
                    <div>
                        <TextField fullWidth={true} margin="normal" label="INTRANET Username" onChange={(event)=> setIntranetUsername(event.target.value)}/>
                    </div>
                    <div>
                    <TextField fullWidth={true} margin="normal" label="Password" type="password" onChange={(event) => setUserPassword(event.target.value)} />
                    </div>
                    */}
                <TextField fullWidth={true} margin="normal" label="Email" type="email" autoComplete="email" onChange={(event) => setEmail(event.target.value)} value={email} onKeyPress={(event) => handleKeypress(event)} />
                <TextField fullWidth={true} margin="normal" label="Token" type="password" autoComplete="current-password" onChange={(event) => setToken(event.target.value)} value={token} onKeyPress={(event) => handleKeypress(event)} />
                <div style={{ paddingBottom: "20px", color: "gray" }}>If you do not yet have an eLabFTW API token/key: first log in to your eLabFTW and generate the API key/token. <a href="https://doc.elabftw.net/api.html" target="_blank">More info</a>.</div>
                    <div style={{
                        display:"flex",
                        justifyContent:"right",
                    }}>
                        <Button style={{margin:"5px"}} variant="outlined" color="secondary" onClick={()=>setOpenLDAPLoginDialog(false)}>Cancel</Button>
                    <Button style={{ margin: "5px" }} variant="contained" color="primary" onClick={() => handleLogin()}>Continue</Button>
                    </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default LDAPLoginDialog;