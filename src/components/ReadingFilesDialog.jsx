import React from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FileReadingGif from '../assets/fileloading.gif'
import { CircularProgress, LinearProgress } from "@material-ui/core";


const ReadingFilesDialog = ({ openReadingFilesDialog, setOpenReadingFilesDialog }) => {

    return (<>
        <Dialog
            onClose={() => openReadingFilesDialog}
            open={openReadingFilesDialog}
            width="500px"
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <div style={{ display: "inline-flex", width: "100%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "20px", width: "100%", alignSelf: "center" }}>
                        The files are being read.
                    </div>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <div style={{ width: "100%", justifyContent: "center" }}>
                    {/*<img
                        style={{ width: "300px", borderRadius: "5px" }}
                        alt="filereadingif"
                        src={FileReadingGif}
                    />*/}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={"50pt"} />
                    </div>
                    <div style={{ fontSize: "15px", width: "100%", textAlign: "center" }}>
                        Do you still remember the files you loaded?
                    </div>
                    <div style={{ fontSize: "15px", width: "100%", textAlign: "center" }}>
                        They are now being read. Please wait and do not turn off your device.
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default ReadingFilesDialog;