import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Popup } from "./Popup";
import "./index.css";

if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
