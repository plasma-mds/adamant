import React from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from "@material-ui/core/Button";
import { Route } from 'react-router-dom'
import { Tooltip } from "@material-ui/core";
import AdamantHeader from "../assets/adamant-header-5.svg"
import BrowseEditLogo from "../assets/browse-edit-exp.svg"
import ReqAnalysisLogo from "../assets/request_analysis.svg"
import ProcRequestLogo from "../assets/process_request.svg"

const ChooseUseCasesDialog = ({ openUseCasesDialog, setOpenUseCasesDialog, firstName, loginState, setOpenLDAPLoginDialog, handleLogOut }) => {

    //onClose={() => setOpenUseCasesDialog(false)}

    return (<>
        <Dialog
            onClose={() => setOpenUseCasesDialog(false)}
            maxWidth={false}
            fullWidth={false}
            open={openUseCasesDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
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
                    <div style={{width:"50%", fontSize: "20px", padding: "10px" }}>
                        What would you like to do?
                    </div>
                    <div style={{
                        display: "flex",
                        width: "50%",
                        height: "100%",
                        paddingRight: "10px",
                        justifyContent: "right",
                        verticalAlign: "top",
                    }}>
                        {loginState === "false" ? (
                            <Button
                                color="primary"
                                onClick={() => setOpenLDAPLoginDialog(true)}
                            >
                                LOG IN
                            </Button>
                        ) : (
                            <>
                                <div
                                    style={{
                                        display: "table-cell",
                                        height: "100%",
                                        padding: "10px",
                                    }}
                                >
                                    Hi, {firstName}!
                                </div>
                                    <div style={{ borderRight: "1px solid #D3D3D3" }}></div>
                                <Button color="secondary" onClick={() => handleLogOut()}>
                                    LOG OUT
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ padding: "10px" }}>
                    <Divider />
                </div>
                <div
                    style={{
                        display: "flex",
                        width: "auto",
                        textAlign: "center",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "10px 10px 0px 10px",
                    }}
                >
                    <div style={{ width: "350px" }}>
                        <Tooltip
                            placement="top"
                            title={<h2 style={{ color: "lightblue" }}>Basically closing this dialog if you click here and use Adamant as it is.</h2>}
                        >
                            <Button onClick={() => setOpenUseCasesDialog(false)} variant="contained" style={{ height: "165px", width: "340px", marginBottom: "5px" }}>
                                <div>
                                    <img
                                        style={{ width: "300px", borderRadius: "5px" }}
                                        alt="header"
                                        src={AdamantHeader}
                                    />
                                </div>
                            </Button>
                        </Tooltip>
                        <Route render={({ history }) => (
                            <Tooltip
                                placement="top"
                                title={<h2 style={{ color: "lightblue" }}>Click here if you'd like to request an analysis.</h2>}
                            >
                                <Button onClick={() => { history.push('/request-job') }} variant="contained" style={{ fontWeight: "normal", height: "165px", width: "340px", marginTop: "5px" }}>
                                    <div>
                                        <img
                                            style={{ height: "80px", borderRadius: "5px" }}
                                            alt="ReqAnalysisLogo"
                                            src={ReqAnalysisLogo}
                                        />
                                    </div>
                                </Button>
                            </Tooltip>)} />
                    </div>
                    <div style={{ width: "350px" }}>
                        <Route render={({ history }) => (
                            <Tooltip
                                placement="top"
                                title={<h2 style={{ color: "lightblue" }}>Browse and edit eLabFTW experiments with Adamant.</h2>}
                            >
                                <Button onClick={() => { history.push('/browse-experiment') }} variant="contained" style={{ fontWeight: "normal", height: "165px", width: "340px", marginBottom: "5px" }}>
                                    <div>
                                        <img
                                            style={{ height: "120px", borderRadius: "5px" }}
                                            alt="BrowseEditLogo"
                                            src={BrowseEditLogo}
                                        />
                                    </div>
                                </Button>
                            </Tooltip>)} />
                        <Route render={({ history }) => (
                            <Tooltip
                                placement="top"
                                title={<h2 style={{ color: "lightblue" }}>If you are an operator, click here to process a request.</h2>}
                            >
                                <Button onClick={() => { history.push('/process-request') }} variant="contained" style={{ fontWeight: "normal", height: "165px", width: "340px", marginTop: "5px" }}>
                                    <div>
                                        <img
                                            style={{ height: "80px", borderRadius: "5px" }}
                                            alt="ProcRequestLogo"
                                            src={ProcRequestLogo}
                                        />
                                    </div>    
                                </Button></Tooltip>)} />
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
            </DialogActions>
        </Dialog>
    </>);
};

export default ChooseUseCasesDialog;