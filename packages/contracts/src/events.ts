import type { EventSource } from "./enums";
import type {
  CommandAck,
  CommandRequested,
  ConnectionState,
  EmergencyNotice,
  ExpeditionMetrics,
  MachineTelemetry,
  PieceScanned,
  RobotTelemetry,
} from "./payloads";

export const SCHEMA_VERSION = "0.1.0" as const;

/** Mapa tipo → payload. Fonte única dos nomes de eventos. */
export interface Smart40EventMap {
  "machine.telemetry": MachineTelemetry;
  "machine.emergency": EmergencyNotice;
  "robot.telemetry": RobotTelemetry;
  "traceability.piece-scanned": PieceScanned;
  "expedition.metrics": ExpeditionMetrics;
  "command.requested": CommandRequested;
  "command.ack": CommandAck;
  "connection.state": ConnectionState;
}

export type Smart40EventType = keyof Smart40EventMap;

export const EVENT_TYPES: readonly Smart40EventType[] = [
  "machine.telemetry",
  "machine.emergency",
  "robot.telemetry",
  "traceability.piece-scanned",
  "expedition.metrics",
  "command.requested",
  "command.ack",
  "connection.state",
] as const;

/** Envelope padrão (runbook, seção 4). */
export interface Smart40Event<T extends Smart40EventType = Smart40EventType> {
  schemaVersion: typeof SCHEMA_VERSION;
  eventId: string;
  type: T;
  /** ISO 8601 UTC */
  timestamp: string;
  source: EventSource;
  data: Smart40EventMap[T];
}

/** Prefixo do barramento no navegador: window event "smart40:<type>". */
export const BUS_PREFIX = "smart40:" as const;

export function busEventName<T extends Smart40EventType>(type: T): `smart40:${T}` {
  return `${BUS_PREFIX}${type}`;
}

/**
 * Evento legado do Guia Completo: "smart40:telemetria" com o payload cru do
 * mock_server_smart40.js. Mantido para compatibilidade; prefira os eventos tipados.
 */
export const LEGACY_TELEMETRY_EVENT = "smart40:telemetria" as const;

/** Formato cru enviado pelo mock_server_smart40.js do professor (a cada 500 ms). */
export interface MockTelemetryPayload {
  timestamp: string;
  estadoGlobal: "PRONTA" | "EM_EXECUCAO" | "PARADA_EMERGENCIA";
  modoOperacao: "MANUAL" | "AUTOMATICO" | "MANUTENCAO";
  velocidadeEsteiraAtual: number;
  estacaoIhm: { travaSegurancaAtiva: boolean; pressaoPneumaticaBar: number };
  roboUR: {
    conectado: boolean;
    programaAtivo: string;
    executandoRotina: boolean;
    garraFechada: boolean;
    temperaturaMotoresC: number;
    posicaoCartesiana: { x: number; y: number; z: number; rx: number; ry: number; rz: number };
    posicaoJuntas: { j1: number; j2: number; j3: number; j4: number; j5: number; j6: number };
  };
  ultimaPecaLida: {
    idPeca: string;
    codigoLote: string;
    timestampLeitura: string;
    qualidadeSuperficie: number;
    statusInspecao: "APROVADA" | "REJEITADA";
  };
  metricasExpedicao: {
    pecasProcessadasTotal: number;
    pecasAprovadasCount: number;
    pecasRejeitadasCount: number;
    tamanhoFilaSaida: number;
    ritmoProducaoPecasPorMinuto: number;
    oeePercentual: number;
  };
}
