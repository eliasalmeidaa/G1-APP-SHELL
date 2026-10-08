import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onSmart40, requestCommand, type Smart40Event } from "@smart40/contracts";
import { GatewayClient } from "./GatewayClient";

class FakeWS {
  static last: FakeWS | null = null;
  static count = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];
  constructor(public url: string) {
    FakeWS.last = this;
    FakeWS.count++;
  }
  send(d: string) { this.sent.push(d); }
  close() {}
  // helpers
  open() { this.onopen?.(); }
  msg(o: unknown) { this.onmessage?.({ data: JSON.stringify(o) }); }
  drop() { this.onclose?.(); }
}

const raw = (over: Record<string, unknown> = {}) => ({
  timestamp: new Date().toISOString(),
  estadoGlobal: "EM_EXECUCAO",
  modoOperacao: "AUTOMATICO",
  velocidadeEsteiraAtual: 65,
  estacaoIhm: { travaSegurancaAtiva: false, pressaoPneumaticaBar: 6.2 },
  roboUR: {
    conectado: true, programaAtivo: "P", executandoRotina: true, garraFechada: false, temperaturaMotoresC: 42,
    posicaoCartesiana: { x: 1, y: 2, z: 3, rx: 0, ry: 0, rz: 0 },
    posicaoJuntas: { j1: 1, j2: 2, j3: 3, j4: 4, j5: 5, j6: 6 },
  },
  ultimaPecaLida: { idPeca: "PECA-001", codigoLote: "L", timestampLeitura: new Date().toISOString(), qualidadeSuperficie: 99, statusInspecao: "APROVADA" },
  metricasExpedicao: { pecasProcessadasTotal: 1, pecasAprovadasCount: 1, pecasRejeitadasCount: 0, tamanhoFilaSaida: 0, ritmoProducaoPecasPorMinuto: 10, oeePercentual: 80 },
  ...over,
});

let gw: GatewayClient;
beforeEach(() => {
  vi.useFakeTimers();
  FakeWS.count = 0;
  gw = new GatewayClient({ url: "ws://x", token: "t", WebSocketImpl: FakeWS as unknown as typeof WebSocket });
  gw.start();
});
afterEach(() => {
  gw.stop();
  vi.useRealTimers();
});

describe("GatewayClient", () => {
  it("envia o token na URL e publica eventos tipados a partir do mock", () => {
    const robot = vi.fn();
    const off = onSmart40("robot.telemetry", robot);
    FakeWS.last!.open();
    FakeWS.last!.msg(raw());
    off();
    expect(FakeWS.last!.url).toBe("ws://x?token=t");
    expect(robot).toHaveBeenCalledOnce();
    expect(robot.mock.calls[0][0].data.jointsDeg).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("não repete a mesma peça (idempotência)", () => {
    const scan = vi.fn();
    const off = onSmart40("traceability.piece-scanned", scan);
    FakeWS.last!.open();
    FakeWS.last!.msg(raw());
    FakeWS.last!.msg(raw());
    off();
    expect(scan).toHaveBeenCalledOnce();
  });

  it("marca STALE quando a telemetria para e DISCONNECTED + reconexão < 3 s ao cair", () => {
    const states: string[] = [];
    const off = onSmart40("connection.state", (e) => states.push(e.data.status));
    FakeWS.last!.open();
    FakeWS.last!.msg(raw());
    vi.advanceTimersByTime(1700);
    expect(gw.getState().status).toBe("STALE");
    FakeWS.last!.drop();
    expect(gw.getState().status).toBe("DISCONNECTED");
    vi.advanceTimersByTime(2999);
    expect(FakeWS.count).toBe(2);
    off();
    expect(states).toContain("STALE");
  });

  it("publica machine.emergency na transição para emergência", () => {
    const em = vi.fn();
    const off = onSmart40("machine.emergency", em);
    FakeWS.last!.open();
    FakeWS.last!.msg(raw());
    FakeWS.last!.msg(raw({ estadoGlobal: "PARADA_EMERGENCIA" }));
    off();
    expect(em.mock.calls.map((c) => (c[0] as Smart40Event<"machine.emergency">).data.active)).toEqual([false, true]);
  });

  it("encaminha comando simulado ao mock e responde ACK SIMULATED", () => {
    const acks = vi.fn();
    const off = onSmart40("command.ack", acks);
    FakeWS.last!.open();
    const id = requestCommand({ target: "MACHINE", action: "START", originModule: "ihm" });
    off();
    expect(JSON.parse(FakeWS.last!.sent[0])).toMatchObject({ acao: "START", origem: "ihm", simulation: true });
    expect(acks.mock.calls[0][0].data).toMatchObject({ commandId: id, status: "SIMULATED" });
  });

  it("rejeita comando quando desconectado", () => {
    const acks = vi.fn();
    const off = onSmart40("command.ack", acks);
    requestCommand({ target: "MACHINE", action: "START", originModule: "ihm" });
    off();
    expect(acks.mock.calls[0][0].data.status).toBe("REJECTED");
  });

  it("descarta JSON inválido sem lançar exceção", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    FakeWS.last!.open();
    expect(() => FakeWS.last!.onmessage?.({ data: "{quebrado" })).not.toThrow();
    warn.mockRestore();
  });
});
