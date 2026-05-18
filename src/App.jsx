import React from "react";
import "./styles.css";
import { Route, Switch, Redirect } from "react-router-dom";
import AdamantMain from "./pages/AdamantMain";
import AdamantRequest from "./pages/AdamantRequest";
import AdamantProcess from "./pages/AdamantProcess";
import packageJson from "../package.json";
import { ToastContainer } from "react-toastify";
import AdamantBrowseExp from "./pages/AdamantBrowseExp";
import AsyncTestPage from "./pages/AsyncTestPage";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red", backgroundColor: "white" }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "10px" }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const homepage = packageJson["homepage"];
  const adamantEndpoint = homepage && homepage.includes("/adamant");

  const routes = (
    <Switch>
      {adamantEndpoint && <Redirect exact from="/" to="/adamant" />}
      <Route exact path={adamantEndpoint ? "/adamant" : "/"} component={AdamantMain} />
      <Route exact path="/request-job" component={AdamantRequest} />
      <Route exact path="/process-request" component={AdamantProcess} />
      <Route exact path="/browse-experiment" component={AdamantBrowseExp} />
      <Route exact path="/async-testpage" component={AsyncTestPage} />
    </Switch>
  );

  return (
    <ErrorBoundary>
      <div className="the_app">
        {routes}
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick={true}
        pauseOnHover={true}
        draggable={false}
        progress={undefined}
      />
    </ErrorBoundary>
  );
}