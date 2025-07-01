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
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
//import { Autocomplete } from '@material-ui/lab';


const DatasetSubmissionDialog = ({ setOpenDatasetSubmissionDialog, openDatasetSubmissionDialog, submitDataset, handleCreateBundle, handleOnlyCertify }) => {
    const [username, setUsername] = useState("")
    const [pass, setPass] = useState("")
    const [disableButton, setDisableButton] = useState(true)

    // cancel submit
    const handleCancelEdit = () => {
        setOpenDatasetSubmissionDialog(false)
    }

    // handle username and pass data
    const handleUsernamePass = (field, event) =>{
        switch (field) {
            case "username":
                setUsername(event.target.value)
                if (event.target.value.length !== 0 && pass.length !== 0){
                    setDisableButton(false)
                } else {
                    setDisableButton(true)
                }
                return
            case "password":
                setPass(event.target.value)
                if (event.target.value.length !== 0 && username.length !== 0) {
                    setDisableButton(false)
                } else {
                    setDisableButton(true)
                }
                return
            default:
                return
        }
    }

    return (
        <><Dialog
            open={openDatasetSubmissionDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "30px", width: "100%", alignSelf: "center" }}>
                        Dataset Submission
                    </div>
                    <IconButton onClick={() => handleCancelEdit()}><CloseIcon fontSize="large" color="secondary" /></IconButton>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <DialogContentText id="alert-dialog-description" component="span">
                    <div>
                        <FormControl component="widget-type">
                            <FormLabel style={{ color: "#01579b" }} component="legend">Dataset submission to the INPTDAT platform. You must be a curator of the platform to be able to submit.</FormLabel>
                            <TextField required margin='normal' style={{ marginTop: "20px" }} variant="outlined" fullWidth={true} label={"Username"} value={username} onChange={(event) => { handleUsernamePass("username", event)}} />
                            <TextField required type='password' margin='normal' style={{ marginTop: "20px" }} variant="outlined" fullWidth={true} label={"Password"} value={pass} onChange={(event) => { handleUsernamePass("password", event) }} />
                        </FormControl>
                    </div>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <div>
                    <div>
                        <Button onClick={() => handleCancelEdit()} color="secondary">
                            Cancel
                        </Button>
                        <Button disabled={disableButton} onClick={() => submitDataset()} color="primary" autoFocus>
                            Submit
                        </Button>
                        <Button disabled={disableButton} onClick={() => submitDataset()} color="primary" autoFocus>
                            Submit and Certify
                        </Button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "right" }}>
                        <Button onClick={() => handleOnlyCertify()} color="primary" autoFocus>
                        Only certify
                        </Button> 
                        <Button onClick={() => handleCreateBundle()} color="primary" autoFocus>
                            Create a bundle
                        </Button>
                    </div>
                </div>
            </DialogActions>
        </Dialog>
        </>

    )
};

export default DatasetSubmissionDialog;