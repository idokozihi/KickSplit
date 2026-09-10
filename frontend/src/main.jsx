import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import MockProvider from "./state/MockProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <MockProvider>
        <App />
      </MockProvider>
    </BrowserRouter>
  </StrictMode>,
);
