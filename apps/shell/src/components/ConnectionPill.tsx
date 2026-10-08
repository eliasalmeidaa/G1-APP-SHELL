import type { ConnectionStatus } from "@smart40/contracts";
import { StatusLed, type LedColor } from "@smart40/ui";
import { useLastEvent } from "../hooks/useBus";

const MAP: Record<ConnectionStatus, { color: LedColor; label: string; blink?: boolean }> = {
  CONNECTED: { color: "green", label: "Conectado" },
  CONNECTING: { color: "yellow", label: "Conectando…", blink: true },
  STALE: { color: "yellow", label: "Dados vencidos (STALE)", blink: true },
  DISCONNECTED: { color: "red", label: "Desconectado" },
};

export function ConnectionPill() {
  const conn = useLastEvent("connection.state");
  const status = conn?.data.status ?? "CONNECTING";
  const m = MAP[status];
  return (
    <span className="conn-pill" data-status={status}>
      <StatusLed color={m.color} blink={m.blink} label={`Simulador: ${m.label}`} />
    </span>
  );
}
