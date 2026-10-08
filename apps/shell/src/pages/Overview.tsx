import { requestCommand, type CommandAction, type MachineStatus } from "@smart40/contracts";
import { AlertBanner, DataTable, IndustrialButton, StatusLed, type LedColor } from "@smart40/ui";
import { useEventLog, useLastEvent } from "../hooks/useBus";

const STATUS_LED: Record<MachineStatus, { color: LedColor; label: string }> = {
  RUNNING: { color: "green", label: "Em execução" },
  READY: { color: "yellow", label: "Pronta / aguardando" },
  STOPPED: { color: "yellow", label: "Parada" },
  EMERGENCY: { color: "red", label: "Emergência" },
  ALARM: { color: "red", label: "Alarme" },
  SAFETY_FAULT: { color: "red", label: "Falha de segurança" },
  UNKNOWN: { color: "off", label: "Desconhecido" },
};

const nd = (v: number | null | undefined, unit = "") => (v == null ? "N/D" : `${v}${unit}`);

export function Overview() {
  const conn = useLastEvent("connection.state");
  const machine = useLastEvent("machine.telemetry");
  const exp = useLastEvent("expedition.metrics");
  const ack = useLastEvent("command.ack");
  const log = useEventLog();

  const connected = conn?.data.status === "CONNECTED";
  // Dado vencido/desconectado → estado UNKNOWN, nunca o último "saudável"
  const status: MachineStatus = connected ? machine?.data.status ?? "UNKNOWN" : "UNKNOWN";
  const led = STATUS_LED[status];
  const lockReason = connected ? undefined : "Bloqueado: sem telemetria válida do simulador";

  const send = (action: CommandAction) => requestCommand({ target: "MACHINE", action, originModule: "shell" });

  return (
    <div className="overview">
      <div className="overview__title">
        <h1>Visão geral da célula</h1>
        <p>App Shell do Grupo 1: barramento, conexão única e navegação para os módulos.</p>
      </div>

      {!connected && (
        <AlertBanner tone="warning" title="Sem telemetria válida">
          Rode <code>npm run mock</code> em outro terminal. Valores abaixo ficam como N/D e os comandos ficam bloqueados.
        </AlertBanner>
      )}

      <div className="overview__grid">
        <section className="smart-card">
          <div className="smart-card-header"><span className="smart-card-title">Estado da máquina</span></div>
          <div className="kv">
            <StatusLed color={led.color} label={led.label} blink={status === "EMERGENCY"} />
            <dl>
              <dt>Modo</dt><dd>{connected ? machine?.data.mode ?? "N/D" : "N/D"}</dd>
              <dt>Esteira</dt><dd>{connected ? nd(machine?.data.conveyorSpeedPercent, " %") : "N/D"}</dd>
              <dt>Pressão</dt><dd>{connected ? nd(machine?.data.pneumaticPressureBar, " bar") : "N/D"}</dd>
              <dt>Intertravamento</dt>
              <dd>{connected && machine ? (machine.data.safetyInterlockOk ? "OK" : "ABERTO") : "N/D"}</dd>
            </dl>
          </div>
        </section>

        <section className="smart-card">
          <div className="smart-card-header"><span className="smart-card-title">Conexão</span></div>
          <dl className="kv-list">
            <dt>Status</dt><dd>{conn?.data.status ?? "CONNECTING"}</dd>
            <dt>Latência</dt><dd>{nd(conn?.data.latencyMs, " ms")}</dd>
            <dt>Última telemetria</dt>
            <dd>{conn?.data.lastTelemetryAt ? new Date(conn.data.lastTelemetryAt).toLocaleTimeString("pt-BR") : "N/D"}</dd>
            <dt>Tentativas</dt><dd>{conn?.data.reconnectAttempt ?? 0}</dd>
          </dl>
        </section>

        <section className="smart-card">
          <div className="smart-card-header">
            <span className="smart-card-title">Produção</span>
            <span className="mock-tag">MOCK</span>
          </div>
          <div className="smart-digital-display">{connected ? nd(exp?.data.totalProduced) : "N/D"}</div>
          <dl className="kv-list">
            <dt>Ritmo</dt><dd>{connected ? nd(exp?.data.piecesPerMinute, " peças/min") : "N/D"}</dd>
            <dt>Rejeitadas</dt><dd>{connected ? nd(exp?.data.totalRejected) : "N/D"}</dd>
          </dl>
        </section>

        <section className="smart-card">
          <div className="smart-card-header">
            <span className="smart-card-title">Teste de comandos</span>
            <span className="mock-tag">DRY-RUN</span>
          </div>
          <div className="cmd-row">
            <IndustrialButton variant="start" locked={!connected} lockedReason={lockReason} onClick={() => send("START")}>Start</IndustrialButton>
            <IndustrialButton variant="primary" locked={!connected} lockedReason={lockReason} onClick={() => send("STOP")}>Stop</IndustrialButton>
            <IndustrialButton variant="reset" locked={!connected} lockedReason={lockReason} onClick={() => send("RESET")}>Reset</IndustrialButton>
            <IndustrialButton variant="emergency" locked={!connected} lockedReason={lockReason} onClick={() => send("EMERGENCY_STOP")}>E-Stop (sim.)</IndustrialButton>
          </div>
          <p className="ack-line" aria-live="polite">
            {ack ? `ACK ${ack.data.status} — ${ack.data.message}` : "Nenhum comando enviado."}
          </p>
        </section>
      </div>

      <section className="smart-card">
        <div className="smart-card-header"><span className="smart-card-title">Log do barramento smart40:*</span></div>
        <DataTable
          rows={log}
          rowKey={(r) => r.key}
          emptyText="Aguardando eventos…"
          columns={[
            { key: "t", header: "Hora", render: (r) => new Date(r.timestamp).toLocaleTimeString("pt-BR") },
            { key: "type", header: "Evento", render: (r) => <code>smart40:{r.type}</code> },
            { key: "src", header: "Origem", render: (r) => r.source },
            { key: "s", header: "Detalhe", render: (r) => r.summary },
          ]}
        />
      </section>
    </div>
  );
}
