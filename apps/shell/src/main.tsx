import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SCHEMA_VERSION } from "@smart40/contracts";
import "@smart40/ui/theme.css";
import "@smart40/ui/components.css";
import "./shell.css";
import { App } from "./App";
import { GatewayClient } from "./gateway/GatewayClient";

const t0 = performance.now();

// Conexão ÚNICA da aplicação. Módulos G2–G5 só escutam window "smart40:*".
const gateway = new GatewayClient({
  url: import.meta.env.VITE_SMART40_WS_URL ?? "ws://localhost:8080",
  // Token de MOCK (sala de aula). Em `npm run dev` usa o do Grupo 1 se não houver .env.local;
  // no build de produção só entra se for definido explicitamente. Nunca usar credencial real aqui.
  token: import.meta.env.VITE_SMART40_WS_TOKEN ?? (import.meta.env.DEV ? "aluno-token-grupo1" : undefined),
});

window.smart40 = {
  schemaVersion: SCHEMA_VERSION,
  getLast: (type) => gateway.getLast(type),
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

gateway.start();

// Promise rejeitada sem tratamento = bug (DoD: zero unhandled rejections)
window.addEventListener("unhandledrejection", (e) => console.error("[smart40/shell] unhandledrejection", e.reason));

requestAnimationFrame(() =>
  console.info(`[smart40/shell] montado em ${(performance.now() - t0).toFixed(1)} ms · contrato v${SCHEMA_VERSION}`),
);

if (import.meta.hot) import.meta.hot.dispose(() => gateway.stop());
