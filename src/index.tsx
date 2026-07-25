import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import "./style/ReportAndStatistics.css";
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import './style/all-privacy-screen.css'
import './style/Contact-info.css'
import './style/group.css'
import './style/intro.css'
import './style/ImageViewer.css'
import './style/newChat.css'
import './style/CustomSearchDropdown.css'
import './style/search-message.css'
import './style/setings.css'
import './style/status.css'
import './style/style.css'
import './style/ToggleButton.css'
import "./style/newChat.css";
import "./style/search-message.css";
import "./style/setings.css";
import "./style/status.css";
import "./style/style.css";
import "./style/modal.css";
import "./style/ToggleButton.css";

import App from "./App";
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <GoogleOAuthProvider clientId="449326108551-pcrq0vdakp3ccbl19n8c498s0f7buplr.apps.googleusercontent.com">
    {/* <React.StrictMode>
         
    </React.StrictMode> */}
    <App />
  
  </GoogleOAuthProvider>
);
