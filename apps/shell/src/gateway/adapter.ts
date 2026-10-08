/**
 * Adaptador: payload cru do mock_server_smart40.js → eventos tipados do contrato v0.1.
 * Quando o gateway real existir (Sprint 2+), só este arquivo muda.
 */
import {
  makeEvent,
  type MachineMode,
  type MachineStatus,
  type MockTelemetryPayload,
  type Smart40Event,
} from "@smart40/contracts";

const STATUS: Record<string, MachineStatus> = {
  PRONTA: "READY",
  EM_EXECUCAO: "RUNNING",
  PARADA_EMERGENCIA: "EMERGENCY",
};
const MODE: Record<string, MachineMode> = {
  MANUAL: "MANUAL",
  AUTOMATICO: "AUTO",
  MANUTENCAO: "MAINTENANCE",
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function isMockTelemetryPayload(v: unknown): v is MockTelemetryPayload {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.timestamp === "string" &&
    typeof o.estadoGlobal === "string" &&
    typeof o.roboUR === "object" && o.roboUR !== null &&
    typeof o.ultimaPecaLida === "object" && o.ultimaPecaLida !== null &&
    typeof o.metricasExpedicao === "object" && o.metricasExpedicao !== null
  );
}

export function adaptMockPayload(p: MockTelemetryPayload): Smart40Event[] {
  const status = STATUS[p.estadoGlobal] ?? "UNKNOWN";
  const emergencyActive = status === "EMERGENCY";
  const interlock = p.estacaoIhm?.travaSegurancaAtiva;
  const r = p.roboUR;
  const j = r.posicaoJuntas;
  const peca = p.ultimaPecaLida;
  const m = p.metricasExpedicao;

  const machine = makeEvent(
    "machine.telemetry",
    {
      status,
      mode: MODE[p.modoOperacao] ?? "UNKNOWN",
      emergencyActive,
      // trava ativa = intertravamento NÃO ok
      safetyInterlockOk: interlock === false,
      conveyorSpeedPercent: num(p.velocidadeEsteiraAtual),
      pneumaticPressureBar: num(p.estacaoIhm?.pressaoPneumaticaBar),
      cycleTimeS: null, // mock não informa
      alarms: emergencyActive ? ["PARADA DE EMERGÊNCIA (SIMULADA)"] : [],
    },
    "mock",
  );

  const robot = makeEvent(
    "robot.telemetry",
    {
      connected: r.conectado === true,
      jointsDeg: [j.j1, j.j2, j.j3, j.j4, j.j5, j.j6],
      tcp: { ...r.posicaoCartesiana },
      gripper: r.garraFechada ? "CLOSED" : "OPEN",
      speedPercent: null, // mock não informa
      programName: r.programaAtivo ?? null,
      programRunning: r.executandoRotina === true,
      motorTemperatureC: num(r.temperaturaMotoresC),
    },
    "mock",
  );

  const scan = makeEvent(
    "traceability.piece-scanned",
    {
      pieceId: peca.idPeca,
      qrCode: `${peca.idPeca}|${peca.codigoLote}`,
      lot: peca.codigoLote ?? null,
      scannedAt: peca.timestampLeitura,
      result: peca.statusInspecao === "APROVADA" ? "APPROVED" : peca.statusInspecao === "REJEITADA" ? "REJECTED" : "PENDING",
      surfaceQualityPercent: num(peca.qualidadeSuperficie),
      reason: peca.statusInspecao === "REJEITADA" ? "Inspeção visual reprovada (mock)" : null,
    },
    "mock",
    // eventId determinístico por peça → idempotência no G4
    `mock-scan-${peca.idPeca}`,
  );

  const expedition = makeEvent(
    "expedition.metrics",
    {
      totalProduced: m.pecasProcessadasTotal,
      totalApproved: m.pecasAprovadasCount,
      totalRejected: m.pecasRejeitadasCount,
      piecesPerMinute: num(m.ritmoProducaoPecasPorMinuto),
      outputQueueSize: num(m.tamanhoFilaSaida),
      activeOrders: null,
      oeePercentMock: num(m.oeePercentual),
      isMock: true,
    },
    "mock",
  );

  return [machine, robot, scan, expedition];
}

/** Converte comando do contrato para o formato que o mock entende ({ acao, origem }). */
export const MOCK_ACTIONS = new Set(["START", "STOP", "RESET", "EMERGENCY_STOP"]);
