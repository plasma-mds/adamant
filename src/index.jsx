import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import CssBaseline from "@material-ui/core/CssBaseline";

const rootElement = document.getElementById("root");

// strict mode is disabled so that findDOMNode warning is suppressed
ReactDOM.render(
  <React.Fragment>
    <CssBaseline />
    <App />
  </React.Fragment>,
  rootElement
);


//use this for strict mode, however it always throws the findDOMNode warning
/*ReactDOM.render(
  <React.StrictMode>
    <Router>
      <CssBaseline />
      <App />
    </Router>
  </React.StrictMode>,
  rootElement
);
*/
