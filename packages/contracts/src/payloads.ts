import type {
  ConnectionStatus,
  GripperState,
  InspectionResult,
  MachineMode,
  MachineStatus,
  ModuleId,
} from "./enums";

/**
 * Regra do contrato: todo número tem unidade no nome ou no comentário.
 * Campo sem dado = null (exibir "N/D"), NUNCA 0 presumido.
 */

/** type: "machine.telemetry" — consumidores: G2 (IHM) e G1 */
export interface MachineTelemetry {
  status: MachineStatus;
  mode: MachineMode;
  emergencyActive: boolean;
  safetyInterlockOk: boolean;
  /** % da velocidade nominal (0–100) */
  conveyorSpeedPercent: number | null;
  /** bar */
  pneumaticPressureBar: number | null;
  /** segundos */
  cycleTimeS: number | null;
  alarms: string[];
}

/** type: "robot.telemetry" — consumidor: G3 */
export interface RobotTelemetry {
  connected: boolean;
  /** J1..J6 em graus */
  jointsDeg: [number, number, number, number, number, number];
  /** TCP: x,y,z em mm; rx,ry,rz em graus */
  tcp: { x: number; y: number; z: number; rx: number; ry: number; rz: number };
  gripper: GripperState;
  /** % (0–100); null quando a fonte não informa */
  speedPercent: number | null;
  programName: string | null;
  programRunning: boolean;
  /** °C */
  motorTemperatureC: number | null;
}

/** type: "traceability.piece-scanned" — consumidor: G4. Idempotente por pieceId/eventId. */
export interface PieceScanned {
  pieceId: string;
  qrCode: string;
  lot: string | null;
  /** ISO 8601 UTC */
  scannedAt: string;
  result: InspectionResult;
  /** % (0–100) */
  surfaceQualityPercent: number | null;
  reason: string | null;
}

/** type: "expedition.metrics" — consumidor: G5. Valores sintéticos: isMock = true. */
export interface ExpeditionMetrics {
  totalProduced: number;
  totalApproved: number;
  totalRejected: number;
  /** peças/min */
  piecesPerMinute: number | null;
  outputQueueSize: number | null;
  activeOrders: number | null;
  /** % — protótipo. Não apresentar como OEE real sem fórmula aprovada. */
  oeePercentMock: number | null;
  isMock: true;
}

/** type: "machine.emergency" — publicado pelo G1 na transição. Propagação < 100 ms. */
export interface EmergencyNotice {
  active: boolean;
  /** Sempre true na Sprint 1: E-Stop web é informativo, não substitui o físico. */
  simulated: true;
}

/** type: "connection.state" — publicado pelo G1 */
export interface ConnectionState {
  status: ConnectionStatus;
  /** ISO 8601 da última telemetria recebida */
  lastTelemetryAt: string | null;
  /** ms */
  latencyMs: number | null;
  reconnectAttempt: number;
}

export type CommandTarget = "MACHINE" | "ROBOT" | "CONVEYOR" | "TRACEABILITY" | "EXPEDITION";

export type CommandAction =
  | "START"
  | "STOP"
  | "RESET"
  | "EMERGENCY_STOP"
  | "SET_MODE"
  | "JOG"
  | "GRIPPER_OPEN"
  | "GRIPPER_CLOSE"
  | "MANUAL_SCAN"
  | "DISPATCH_ORDER";

/** type: "command.requested" — emitido pelos módulos G2–G5 */
export interface CommandRequested {
  commandId: string;
  target: CommandTarget;
  action: CommandAction;
  originModule: ModuleId;
  params?: Record<string, string | number | boolean>;
  /** Sprint 1: obrigatório true. Comando sem isso é REJECTED. */
  simulation: true;
}

export type CommandAckStatus = "SIMULATED" | "ACCEPTED" | "REJECTED";

/** type: "command.ack" — emitido pelo G1 (gateway/mock) */
export interface CommandAck {
  commandId: string;
  status: CommandAckStatus;
  message: string;
}
