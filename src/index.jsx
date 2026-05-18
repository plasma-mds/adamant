import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
//import { HashRouter as Router } from "react-router-dom";
import App from "./App";
import CssBaseline from "@material-ui/core/CssBaseline";

const rootElement = document.getElementById("root");

// strict mode is disabled so that findDOMNode warning is suppressed
ReactDOM.render(
  <Router>
    <CssBaseline />
    <App />
  </Router>,
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