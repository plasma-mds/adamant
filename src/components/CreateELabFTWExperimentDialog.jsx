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
import { Autocomplete } from '@material-ui/lab';


const CreateELabFTWExperimentDialog = ({ getTagsELabFTW, eLabURL, setELabURL, setTags, tags, setRetrievedTags, retrievedTags, setExperimentTitle, setToken, token, setOpenCreateElabFTWExperimentDialog, openCreateElabFTWExperimentDialog, createExperimentELabFTW }) => {

    const onTagsChange = (event, values) => {
        setTags(values);
    };

    // cancel submit
    const handleCancelEdit = () => {
        setOpenCreateElabFTWExperimentDialog(false)
        setRetrievedTags([])
        setTags([])
    }

    return (
        <><Dialog
            open={openCreateElabFTWExperimentDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "30px", width: "100%", alignSelf: "center" }}>
                        Create eLabFTW Experiment
                    </div>
                    <IconButton onClick={() => handleCancelEdit()}><CloseIcon fontSize="large" color="secondary" /></IconButton>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <DialogContentText id="alert-dialog-description" component="span">
                    <div>
                        <FormControl component="widget-type">
                            <FormLabel style={{ color: "#01579b" }} component="legend">eLabFTW</FormLabel>
                            <TextField required value={eLabURL} margin='normal' onChange={event => setELabURL(event.target.value)} style={{ marginTop: "20px" }} variant="outlined" fullWidth={true} label={"Your eLabFTW main URL"} />
                            <TextField required margin='normal' onChange={event => setToken(event.target.value)} style={{ marginTop: "20px" }} variant="outlined" fullWidth={true} label={"Your eLabFTW token"} value={token} />
                            <TextField margin='normal' onBlur={event => setExperimentTitle(event.target.value)} style={{ marginTop: "10px" }} variant="outlined" fullWidth={true} label={"Experiment title"} />
                            <div style={{ display: 'inline-flex', width: '100%' }}>
                                <Autocomplete
                                    style={{ width: "100%" }}
                                    disabled={retrievedTags.length === 0 ? true : false}
                                    multiple
                                    freeSolo
                                    options={retrievedTags}
                                    getOptionLabel={option => option.tag || option}
                                    onChange={onTagsChange}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            disabled={retrievedTags.length === 0 ? true : false}
                                            variant="outlined"
                                            label="Tags"
                                            margin="normal"
                                            style={{ marginTop: "10px" }}
                                            helperText='Press the "GET TAGS" button to retrieve available tags from your eLabFTW system.Note: you have to provide the eLabFTW main URL and token to enable the button.'
                                        />
                                    )}
                                />
                                {/*<TextField disabled={retrievedTags.length === 0 ? true : false} margin='normal' style={{ marginTop: "10px" }} variant="outlined" fullWidth={true} label={"Tags"} helperText='Press the "GET TAGS" button to retrieve available tags from your eLabFTW system. Note: you have to provide the eLabFTW main URL and token to enable the button.' />*/}
                                <Button onClick={() => getTagsELabFTW()} disabled={(token.trim() === "" | eLabURL.trim() === "") | (token === undefined | eLabURL === undefined) ? true : false} style={{ marginLeft: "5px", height: "55px", marginTop: "11px" }} variant="contained" color="primary">Get Tags</Button>
                            </div>
                        </FormControl>
                    </div>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleCancelEdit()} color="secondary">
                    Cancel
                </Button>
                <Button disabled={(token.trim() === "" | eLabURL.trim() === "") | (token === undefined | eLabURL === undefined) ? true : false} onClick={() => createExperimentELabFTW()} color="primary" autoFocus>
                    Create Experiment
                </Button>
            </DialogActions>
        </Dialog>
        </>

    )
};

export default CreateELabFTWExperimentDialog;