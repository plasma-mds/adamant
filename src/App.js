import React from "react";
import "./styles.css";
import { Route, Switch, Redirect } from "react-router-dom";
import AdamantMain from "./pages/AdamantMain";
import AdamantRequest from "./pages/AdamantRequest";
import AdamantProcess from "./pages/AdamantProcess";
import "cors";
import packageJson from "../package.json";
import { ToastContainer } from "react-toastify";
import AdamantBrowseExp from "./pages/AdamantBrowseExp";
import AsyncTestPage from "./pages/AsyncTestPage"

export default function App() {

  // check if adamant endpoint exists in the homepage
  const homepage = packageJson["homepage"];
  const adamantEndpoint = homepage.includes("/adamant")

  if (adamantEndpoint) {
    console.log("/adamant endpoint is detected")
    return (
      /** Use this for if homepage has /adamant endpoint, this is only for deploying on github-page */
      <>
        <div className="the_app">
          <Switch>
            <Redirect exact from="/" to="/adamant" />
            <Route exact path="/adamant" component={AdamantMain}></Route>
            <Route exact path="/adamant/request-job" component={AdamantRequest}></Route>
            <Route exact path="/adamant/process-request" component={AdamantProcess}></Route>
            <Route exact path="/adamant/browse-experiment" component={AdamantBrowseExp}></Route>
            <Route exact path="/adamant/async-testpage" component={AsyncTestPage}></Route>
          </Switch>
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          closeOnClick={true}
          pauseOnHover={true}
          draggable={false}
          progress={undefined} />
      </>
    );
  } else {
    return (
      <>
        <div className="the_app">
          <Switch>
            <Route exact path="/" component={AdamantMain}></Route>
            <Route exact path="/request-job" component={AdamantRequest}></Route>
            <Route exact path="/process-request" component={AdamantProcess}></Route>
            <Route exact path="/browse-experiment" component={AdamantBrowseExp}></Route>
            <Route exact path="/async-testpage" component={AsyncTestPage}></Route>
          </Switch>
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={2000}
          hideProgressBar={false}
          closeOnClick={true}
          pauseOnHover={true}
          draggable={false}
          progress={undefined} />
      </>
    );
  };
};