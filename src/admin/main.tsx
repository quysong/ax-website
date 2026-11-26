import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GlobalStyle } from "../styles";
import AdminApp from "./AdminApp";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing admin root element.");
}

createRoot(root).render(
  <StrictMode>
    <GlobalStyle />
    <AdminApp />
  </StrictMode>,
);
