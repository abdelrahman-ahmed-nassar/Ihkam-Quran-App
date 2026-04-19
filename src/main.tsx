import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onOfflineReady() {
    console.log("App is ready to work offline.");
  },
  onNeedRefresh() {
    console.log("New content is available; please refresh.");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
