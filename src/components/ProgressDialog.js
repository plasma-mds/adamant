import React, { useEffect } from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FileReadingGif from '../assets/fileloading.gif'
import { CircularProgress, LinearProgress, CircularProgressProps } from "@material-ui/core";
import { IconButton, Button } from '@material-ui/core';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function CircularProgressWithLabel(props) {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

CircularProgressWithLabel.propTypes = {
    /**
     * The value of the progress indicator for the determinate variant.
     * Value between 0 and 100.
     * @default 0
     */
    value: PropTypes.number.isRequired,
};

const ProgressDialog = ({ openProgressDialog, setOpenProgressDialog, title, messages, progress }) => {

    //useEffect(()=>{
    //},[progress])

    return (<>
        <Dialog
            onClose={() => openProgressDialog}
            open={openProgressDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "20px", width: "100%", alignSelf: "center" }}>
                        {title}
                    </div>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <div style={{ width: "500px", height:"100%", justifyContent: "center" }}>
                    {/*<img
                        style={{ width: "300px", borderRadius: "5px" }}
                        alt="filereadingif"
                        src={FileReadingGif}
                    />*/}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <CircularProgressWithLabel value={progress} size={"50pt"} />
                    </div>
                    <div style={{padding:"10px", fontSize: "15px", width: "100%", height:"50px", textAlign: "center", verticalAlign: "middle", lineHeight: "100%" }}>
                        {messages}
                    </div>
                    <div style={{display:"flex", justifyContent:"right"}}>
                        <Button onClick={() => setOpenProgressDialog(false)} color="secondary">Abort</Button>
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default ProgressDialog;