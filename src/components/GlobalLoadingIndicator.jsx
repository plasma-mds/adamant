import React from "react";
import { CircularProgress, Fade, Paper } from "@material-ui/core";

// small "still working..." badge pinned to the bottom-right corner, shown whenever a
// slow async operation (schema list fetch, schema fetch + render) is in flight
const GlobalLoadingIndicator = ({ loading }) => {
  return (
    <Fade in={loading} unmountOnExit>
      <Paper
        elevation={6}
        data-testid="global-loading-indicator"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          borderRadius: "24px",
          zIndex: 2000,
        }}
      >
        <CircularProgress size={20} thickness={5} style={{ marginRight: "12px" }} />
        <span style={{ fontSize: "13px" }}>Loading...</span>
      </Paper>
    </Fade>
  );
};

export default GlobalLoadingIndicator;
