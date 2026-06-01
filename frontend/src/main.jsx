import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./continuiteErgo.css";
import "./parcoursReferentiel.css";
import "./diagnosticReferentiel.css";
import "./tnsErgo.css";
import "./darkMode.css";
import "./readableLargeText.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
