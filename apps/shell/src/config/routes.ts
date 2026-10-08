/**
 * Fonte única das rotas do App Shell. Também servida em /api/app-shell/routes.
 * Para trocar a URL de um módulo, edite public/importmap.json (ou use import-map-overrides).
 */
import type { Smart40EventType } from "@smart40/contracts";

export interface ModuleRoute {
  /** Nome no importmap.json / Single-SPA */
  app: string;
  path: string;
  label: string;
  group: number;
  title: string;
  devUrl: string;
  consumes: Smart40EventType[];
  emits: Smart40EventType[];
}

export const MODULE_ROUTES: ModuleRoute[] = [
  {
    app: "@smart40/ihm-siemens",
    path: "/operacao",
    label: "IHM Siemens",
    group: 2,
    title: "IHM Siemens & Botoeira",
    devUrl: "http://localhost:8081",
    consumes: ["machine.telemetry", "machine.emergency", "connection.state", "command.ack"],
    emits: ["command.requested"],
  },
  {
    app: "@smart40/robo-ur",
    path: "/robo",
    label: "Robô UR",
    group: 3,
    title: "Cobot Universal Robots",
    devUrl: "http://localhost:8082",
    consumes: ["robot.telemetry", "machine.emergency", "connection.state", "command.ack"],
    emits: ["command.requested"],
  },
  {
    app: "@smart40/rastreabilidade-qrcode",
    path: "/rastreabilidade",
    label: "Rastreabilidade",
    group: 4,
    title: "Rastreabilidade, Visão & QR Code",
    devUrl: "http://localhost:8083",
    consumes: ["traceability.piece-scanned", "connection.state"],
    emits: ["command.requested"],
  },
  {
    app: "@smart40/expedicao-oee",
    path: "/expedicao",
    label: "Expedição & OEE",
    group: 5,
    title: "Posto de Expedição & Métricas",
    devUrl: "http://localhost:8084",
    consumes: ["expedition.metrics", "connection.state"],
    emits: ["command.requested"],
  },
];

export const MODULE_ROOT_ID = "smart40-module-root";
