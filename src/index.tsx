import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from 'react-toastify';
import App from "./App";

import "./style/ReportAndStatistics.css";
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import './style/all-privacy-screen.css';
import './style/Contact-info.css';
import './style/group.css';
import './style/intro.css';
import './style/ImageViewer.css';
import './style/newChat.css';
import './style/CustomSearchDropdown.css';
import './style/search-message.css';
import './style/setings.css';
import './style/status.css';
import './style/style.css';
import './style/ToggleButton.css';
import "./style/modal.css";

// Global safety patch for react-toastify to prevent runtime crashes across all modules
const patchToastMethod = (originalMethod: Function) => {
  return (content: any, options?: any) => {
    if (content === undefined || content === null || content === '') return;
    try {
      return originalMethod(content, options);
    } catch (err) {
      console.warn('Toast display suppressed:', err);
    }
  };
};
toast.error = patchToastMethod(toast.error);
toast.success = patchToastMethod(toast.success);
toast.info = patchToastMethod(toast.info);
toast.warn = patchToastMethod(toast.warn);
toast.warning = patchToastMethod(toast.warning || toast.warn);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// App-wide QueryClient for react-query hooks (shared Kanban engine, etc.).
// task-kanban's own modal still wraps its subtree in a second, local
// QueryClientProvider - that inner one just shadows this one for its
// subtree, so it keeps its existing isolated cache untouched.
const queryClient = new QueryClient();

root.render(
  <GoogleOAuthProvider clientId="449326108551-pcrq0vdakp3ccbl19n8c498s0f7buplr.apps.googleusercontent.com">
    <QueryClientProvider client={queryClient}>
      {/* <React.StrictMode>

      </React.StrictMode> */}
      <App />
    </QueryClientProvider>
  </GoogleOAuthProvider>
);
