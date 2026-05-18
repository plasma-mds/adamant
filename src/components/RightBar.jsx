import { IconButton, InputBase, Paper } from "@mui/material";
import SearchIcon from "@material-ui/icons/Search";
import { Button, Divider } from "@material-ui/core";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import $ from "jquery";

const RightBar = ({ sessionData, setSessionData, isLoggedIn, setIsLoggedIn }) => {


    useEffect(() => {
        $.ajax({
            url: "/api/send_current_session",
            type: "GET",
            crossDomain: true,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*"
            },
            success: function (status) {
                console.log("current session data:", status)
                if (Object.keys(status).length !== 0 && status["profile"] !== undefined) {
                    setSessionData(status)
                    setIsLoggedIn(true)
                }
            },
            error: function (status) {
                console.log(status)
            }
        })
    }, [])

    const onSignIn = () => {
        $.ajax({
            url: "/login",
            crossDomain: true,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*"
            },
            success: function (status) {
                console.log("Sign in success.");
                console.log(status)
                window.open(status['login_uri'], "_self")
            },
            error: function (status) {
                console.log("Sign in error.");
                console.log(status)
            }
        })
    }

    const onSignOut = () => {
        setIsLoggedIn(false)
        $.ajax({
            url: "/logout",
            crossDomain: true,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*"
            },
            success: function (status) {
                console.log("Sign out success.");
                console.log(status)
                console.log(sessionData)
                setSessionData({})
                toast.success(
                    <>
                        <div>
                            <strong>You have successfully signed out.</strong>
                        </div>
                    </>,
                    {
                        toastId: "signoutsuccess",
                    }
                );
            },
            error: function (status) {
                console.log("Sign out error.");
                console.log(status)
            }
        })
    }

    return (
        <>
            <div style={{ textAlign: "right", justifyContent: "right", height: "40px", display: "flex" }}>
                <div style={{ height: "100%", lineHeight: "40px", verticalAlign: 'middle' }}>
                    {isLoggedIn ? `Hi, ${sessionData["profile"]["name"]}!` : "Not signed in."}
                </div>
                {isLoggedIn ? <Button onClick={() => onSignOut()} style={{ color: "red" }}>SIGN OUT</Button> : <Button onClick={() => onSignIn()} style={{ color: "blue" }}>SIGN IN</Button>}
            </div>
            <div style={{ paddingTop: '5px' }}>
                <Paper
                    component="form"
                    sx={{ display: 'flex', alignItems: 'center', width: 'auto' }}
                >
                    <InputBase
                        sx={{ ml: 1, flex: 1 }}
                        placeholder="Search stuff here"
                        inputProps={{ 'aria-label': 'search stuff' }}
                    />
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                        <SearchIcon />
                    </IconButton>
                </Paper>
            </div>
        </>
    )
}

export default RightBar;