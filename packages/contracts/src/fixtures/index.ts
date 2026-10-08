/**
 * Fixtures v0.1 — dados SINTÉTICOS (source: "mock") para os grupos renderizarem
 * sem rede industrial. Inclui estados inseguros exigidos no runbook (seção 7).
 */
import { SCHEMA_VERSION, type Smart40Event, type Smart40EventType, type Smart40EventMap } from "../events";

const T0 = "2026-10-07T15:00:00.000Z";
const ev = <T extends Smart40EventType>(type: T, eventId: string, data: Smart40EventMap[T]): Smart40Event<T> => ({
  schemaVersion: SCHEMA_VERSION,
  eventId,
  type,
  timestamp: T0,
  source: "mock",
  data,
});

export const machineRunning = ev("machine.telemetry", "mock-machine-001", {
  status: "RUNNING",
  mode: "AUTO",
  emergencyActive: false,
  safetyInterlockOk: true,
  conveyorSpeedPercent: 65,
  pneumaticPressureBar: 6.2,
  cycleTimeS: 4.8,
  alarms: [],
});

export const machineEmergency = ev("machine.telemetry", "mock-machine-002", {
  ...machineRunning.data,
  status: "EMERGENCY",
  emergencyActive: true,
  safetyInterlockOk: false,
  conveyorSpeedPercent: 0,
  alarms: ["E-STOP SIMULADO ACIONADO"],
});

export const machineSafetyFault = ev("machine.telemetry", "mock-machine-003", {
  ...machineRunning.data,
  status: "SAFETY_FAULT",
  safetyInterlockOk: false,
  conveyorSpeedPercent: 0,
  alarms: ["INTERTRAVAMENTO ABERTO"],
});

export const machineUnknown = ev("machine.telemetry", "mock-machine-004", {
  status: "UNKNOWN",
  mode: "UNKNOWN",
  emergencyActive: false,
  safetyInterlockOk: false,
  conveyorSpeedPercent: null,
  pneumaticPressureBar: null,
  cycleTimeS: null,
  alarms: [],
});

export const robotRunning = ev("robot.telemetry", "mock-robot-001", {
  connected: true,
  jointsDeg: [0, -90, 90, -90, -90, 0],
  tcp: { x: 350, y: -120, z: 215, rx: 0, ry: 180, rz: 45 },
  gripper: "OPEN",
  speedPercent: null,
  programName: "ROTINA_PALETIZACAO_MAIN",
  programRunning: true,
  motorTemperatureC: 42.5,
});

export const pieceApproved = ev("traceability.piece-scanned", "mock-scan-PECA-001", {
  pieceId: "PECA-001",
  qrCode: "PECA-001|LOTE-2026-A9",
  lot: "LOTE-2026-A9",
  scannedAt: T0,
  result: "APPROVED",
  surfaceQualityPercent: 98.5,
  reason: null,
});

export const pieceRejected = ev("traceability.piece-scanned", "mock-scan-PECA-002", {
  ...pieceApproved.data,
  pieceId: "PECA-002",
  qrCode: "PECA-002|LOTE-2026-A9",
  result: "REJECTED",
  surfaceQualityPercent: 78.2,
  reason: "Qualidade de superfície abaixo de 95%",
});

export const expeditionMetrics = ev("expedition.metrics", "mock-exp-001", {
  totalProduced: 142,
  totalApproved: 138,
  totalRejected: 4,
  piecesPerMinute: 12.4,
  outputQueueSize: 3,
  activeOrders: null,
  oeePercentMock: 88.5,
  isMock: true,
});

export const commandStart = ev("command.requested", "mock-cmd-001", {
  commandId: "cmd-0001",
  target: "MACHINE",
  action: "START",
  originModule: "ihm",
  simulation: true,
});

export const commandAckSimulated = ev("command.ack", "mock-ack-001", {
  commandId: "cmd-0001",
  status: "SIMULATED",
  message: "Comando simulado encaminhado ao mock. Nenhum hardware acionado.",
});

export const connectionConnected = ev("connection.state", "mock-conn-001", {
  status: "CONNECTED",
  lastTelemetryAt: T0,
  latencyMs: 12,
  reconnectAttempt: 0,
});

export const connectionStale = ev("connection.state", "mock-conn-002", {
  status: "STALE",
  lastTelemetryAt: T0,
  latencyMs: null,
  reconnectAttempt: 0,
});

export const allFixtures = [
  machineRunning,
  machineEmergency,
  machineSafetyFault,
  machineUnknown,
  robotRunning,
  pieceApproved,
  pieceRejected,
  expeditionMetrics,
  commandStart,
  commandAckSimulated,
  connectionConnected,
  connectionStale,
] as const;
