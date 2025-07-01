import React, { useState } from "react";
import Divider from '@material-ui/core/Divider';
import { IconButton, Button } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import CloseIcon from '@material-ui/icons/Close';
import { Menu, MenuItem } from "@material-ui/core";


const FormReviewBeforeSubmit = ({ onlineMode, openFormReviewDialog, setOpenFormReviewDialog, descriptionList, setOpenFunctions, submitFunctions, submitText, endPoint, loadedFiles }) => {

    // for dropdown buttons
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    }; //

    //createElabFTWButton disable when
    endPoint = endPoint.split("/").slice(-1)

    const validateLoadedFiles = () => {
        console.log(loadedFiles)
        if (loadedFiles.includes(undefined)) {
            alert("Some files are not assigned to the metadata. Please complete the process.")
            setOpenFormReviewDialog(false)
        } else {
            setOpenFunctions.setOpenDatasetSubmissionDialog(true);
            setOpenFormReviewDialog(false);
        }
    }


    return (<>
        <Dialog
            onClose={() => setOpenFormReviewDialog(false)}
            maxWidth="md"
            fullWidth={true}
            open={openFormReviewDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "30px", width: "100%", alignSelf: "center" }}>
                        Form review and submission
                    </div>
                    <IconButton onClick={() => setOpenFormReviewDialog(false)}><CloseIcon fontSize="large" color="secondary" /></IconButton>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContentText style={{ paddingLeft: "25px", paddingTop: "10px" }} id="alert-dialog-description" component="span">
                Please review your filled form before submitting.
            </DialogContentText>
            <DialogContent>
                <div dangerouslySetInnerHTML={{ __html: descriptionList }}></div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenFormReviewDialog(false)} color="secondary">
                    Cancel
                </Button>
                <Button
                    style={{ float: "right", marginRight: "5px" }}
                    id="demo-positioned-button"
                    aria-controls={open ? "demo-positioned-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={handleClick}
                    variant="contained"
                    color="primary"
                >
                    Submit
                </Button>
                <Menu
                    id="demo-positioned-menu"
                    aria-labelledby="demo-positioned-button"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "left",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                    }}
                >
                    <MenuItem disabled={!onlineMode} onClick={() => {
                        setOpenFunctions.setOpenCreateElabFTWExperimentDialog(true);
                        setOpenFormReviewDialog(false);
                    }} >
                        Create eLabFTW Experiment
                    </MenuItem>
                    <MenuItem disabled={!onlineMode || endPoint.includes("process-request")} onClick={() => {
                        submitFunctions.submitJobRequest();
                        setOpenFormReviewDialog(false);
                    }} >
                        {submitText}
                    </MenuItem>
                    <MenuItem disabled={!onlineMode} onClick={() => {
                        validateLoadedFiles()
                    }} >
                        Submit Dataset
                    </MenuItem>
                </Menu>
            </DialogActions>
        </Dialog>
    </>);
};

export default FormReviewBeforeSubmit;