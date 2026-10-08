/**
 * GatewayClient — ÚNICA conexão WebSocket da aplicação (regra do Grupo 1).
 * - Converte mensagens do mock para eventos do contrato e publica em window ("smart40:<type>").
 * - Mantém "connection.state" (CONNECTING / CONNECTED / DISCONNECTED / STALE).
 * - Reconecta sozinho (< 3 s) sem duplicar listeners.
 * - Recebe "command.requested" dos módulos, valida (simulation:true) e responde "command.ack".
 */
import {
  busEventName,
  isSmart40Event,
  LEGACY_TELEMETRY_EVENT,
  makeEvent,
  publishSmart40,
  validateCommand,
  type ConnectionState,
  type ConnectionStatus,
  type Smart40Event,
  type Smart40EventType,
} from "@smart40/contracts";
import { adaptMockPayload, isMockTelemetryPayload, MOCK_ACTIONS } from "./adapter";

export interface GatewayOptions {
  url: string;
  token?: string;
  /** Sem telemetria por este tempo → STALE. Mock envia a cada 500 ms. */
  staleAfterMs?: number;
  reconnectDelayMs?: number;
  target?: Window;
  WebSocketImpl?: typeof WebSocket;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private readonly opts: Required<Omit<GatewayOptions, "token">> & { token?: string };
  private state: ConnectionState = { status: "DISCONNECTED", lastTelemetryAt: null, latencyMs: null, reconnectAttempt: 0 };
  private lastMessageAt = 0;
  private lastPieceId: string | null = null;
  private lastEmergency: boolean | null = null;
  private readonly cache = new Map<Smart40EventType, Smart40Event>();
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(options: GatewayOptions) {
    this.opts = {
      staleAfterMs: 1500,
      reconnectDelayMs: 1000,
      target: window,
      WebSocketImpl: WebSocket,
      ...options,
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.opts.target.addEventListener(busEventName("command.requested"), this.onCommand);
    this.watchdog = setInterval(this.checkStale, 100);
    this.connect();
  }

  stop(): void {
    this.running = false;
    this.opts.target.removeEventListener(busEventName("command.requested"), this.onCommand);
    if (this.watchdog) clearInterval(this.watchdog);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.watchdog = this.reconnectTimer = null;
    this.closeSocket();
    this.setStatus("DISCONNECTED");
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  getLast<T extends Smart40EventType>(type: T): Smart40Event<T> | undefined {
    return this.cache.get(type) as Smart40Event<T> | undefined;
  }

  // ------------------------------------------------------------------ conexão
  private connect(): void {
    if (!this.running) return;
    this.closeSocket();
    this.setStatus("CONNECTING");
    const url = this.opts.token
      ? `${this.opts.url}${this.opts.url.includes("?") ? "&" : "?"}token=${encodeURIComponent(this.opts.token)}`
      : this.opts.url;
    let ws: WebSocket;
    try {
      ws = new this.opts.WebSocketImpl(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    // handlers por propriedade: um socket novo = handlers novos, nunca duplicados
    ws.onopen = () => {
      this.state.reconnectAttempt = 0;
      this.lastMessageAt = Date.now();
      this.setStatus("CONNECTED");
    };
    ws.onmessage = (e: MessageEvent) => this.handleMessage(e.data);
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.setStatus("DISCONNECTED");
      this.scheduleReconnect();
    };
    ws.onerror = () => {
      /* onclose vem em seguida; nada a fazer aqui */
    };
  }

  private closeSocket(): void {
    const ws = this.ws;
    this.ws = null;
    if (!ws) return;
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }

  private scheduleReconnect(): void {
    if (!this.running || this.reconnectTimer) return;
    this.state.reconnectAttempt += 1;
    // 1s, 2s, 2.5s, 2.5s... sempre < 3 s (SLA)
    const delay = Math.min(this.opts.reconnectDelayMs * this.state.reconnectAttempt, 2500);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private lastHeartbeat = 0;

  private checkStale = (): void => {
    const now = Date.now();
    if (this.state.status === "CONNECTED" && now - this.lastMessageAt > this.opts.staleAfterMs) {
      this.setStatus("STALE");
    } else if (this.state.status === "CONNECTED" && now - this.lastHeartbeat >= 1000) {
      // heartbeat 1 s: atualiza latência/última telemetria para quem exibe a conexão
      this.lastHeartbeat = now;
      this.emit(makeEvent("connection.state", this.getState(), "shell"));
    }
  };

  private setStatus(status: ConnectionStatus): void {
    if (this.state.status === status) return;
    this.state = { ...this.state, status };
    this.emit(makeEvent("connection.state", this.getState(), "shell"));
  }

  // --------------------------------------------------------------- mensagens
  private handleMessage(raw: unknown): void {
    let data: unknown;
    try {
      data = JSON.parse(String(raw));
    } catch {
      console.warn("[smart40/gateway] mensagem descartada: JSON inválido");
      return;
    }

    let events: Smart40Event[];
    if (isSmart40Event(data)) {
      events = [data];
    } else if (isMockTelemetryPayload(data)) {
      // compatibilidade com o Guia Completo (evento cru)
      this.opts.target.dispatchEvent(new CustomEvent(LEGACY_TELEMETRY_EVENT, { detail: data }));
      events = adaptMockPayload(data);
    } else {
      console.warn("[smart40/gateway] mensagem descartada: formato desconhecido", data);
      return;
    }

    const now = Date.now();
    this.lastMessageAt = now;
    const ts = Date.parse((data as { timestamp: string }).timestamp);
    this.state = {
      ...this.state,
      lastTelemetryAt: new Date(now).toISOString(),
      latencyMs: Number.isNaN(ts) ? null : Math.max(0, now - ts),
    };
    if (this.state.status !== "CONNECTED") this.setStatus("CONNECTED");

    for (const ev of events) this.route(ev);
  }

  private route(ev: Smart40Event): void {
    if (ev.type === "traceability.piece-scanned") {
      const id = (ev as Smart40Event<"traceability.piece-scanned">).data.pieceId;
      if (id === this.lastPieceId) return; // idempotência: mesma peça não repete
      this.lastPieceId = id;
    }
    if (ev.type === "machine.telemetry") {
      const active = (ev as Smart40Event<"machine.telemetry">).data.emergencyActive;
      if (active !== this.lastEmergency) {
        this.lastEmergency = active;
        // publicado ANTES da telemetria para propagação imediata (< 100 ms)
        this.emit(makeEvent("machine.emergency", { active, simulated: true }, "shell"));
      }
    }
    this.emit(ev);
  }

  private emit(ev: Smart40Event): void {
    this.cache.set(ev.type, ev);
    publishSmart40(ev, this.opts.target);
  }

  // ---------------------------------------------------------------- comandos
  private onCommand = (e: Event): void => {
    const env = (e as CustomEvent<unknown>).detail;
    const payload = isSmart40Event(env) ? env.data : env;
    const v = validateCommand(payload);
    const commandId =
      typeof (payload as { commandId?: unknown })?.commandId === "string"
        ? (payload as { commandId: string }).commandId
        : "desconhecido";

    if (!v.ok) return this.ack(commandId, "REJECTED", v.reason);
    if (this.state.status !== "CONNECTED" || !this.ws) {
      return this.ack(commandId, "REJECTED", `Sem conexão com o simulador (${this.state.status})`);
    }
    const { cmd } = v;
    if (MOCK_ACTIONS.has(cmd.action)) {
      this.ws.send(JSON.stringify({ acao: cmd.action, origem: cmd.originModule, commandId: cmd.commandId, simulation: true }));
      this.ack(cmd.commandId, "SIMULATED", `${cmd.action} enviado ao simulador. Nenhum hardware acionado.`);
    } else {
      this.ack(cmd.commandId, "SIMULATED", `${cmd.action} registrado apenas na interface (mock não implementa).`);
    }
  };

  private ack(commandId: string, status: "SIMULATED" | "REJECTED", message: string): void {
    this.emit(makeEvent("command.ack", { commandId, status, message }, "shell"));
  }
}
