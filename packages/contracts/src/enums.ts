/** Enums compartilhados. NÃO redefinir nos módulos — importe daqui. */

/** Estado global da célula. UNKNOWN = sem dado confiável (nunca assumir RUNNING). */
export type MachineStatus =
  | "READY"
  | "RUNNING"
  | "STOPPED"
  | "EMERGENCY"
  | "ALARM"
  | "SAFETY_FAULT"
  | "UNKNOWN";

export type MachineMode = "MANUAL" | "SEMI_AUTO" | "AUTO" | "MAINTENANCE" | "UNKNOWN";

export type GripperState = "OPEN" | "CLOSED" | "HOLDING" | "UNKNOWN";

export type InspectionResult = "PENDING" | "APPROVED" | "REJECTED";

export type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "STALE";

/** Origem do evento. Na Sprint 1 só existe "mock" (e "ui" para comandos). */
export type EventSource = "mock" | "gateway" | "ui" | "shell";

export type ModuleId = "shell" | "ihm" | "robot" | "traceability" | "expedition";
