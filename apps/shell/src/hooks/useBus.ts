import { useEffect, useState } from "react";
import { EVENT_TYPES, onSmart40, type Smart40Event, type Smart40EventType } from "@smart40/contracts";

/** Último evento de um tipo (inicia com o cache do Shell para não piscar vazio). */
export function useLastEvent<T extends Smart40EventType>(type: T): Smart40Event<T> | undefined {
  const [ev, setEv] = useState<Smart40Event<T> | undefined>(() => window.smart40?.getLast(type));
  useEffect(() => onSmart40(type, setEv), [type]);
  return ev;
}

export interface LogEntry {
  key: string;
  type: Smart40EventType;
  timestamp: string;
  source: string;
  summary: string;
}

const NOISY: Smart40EventType[] = ["machine.telemetry", "robot.telemetry", "expedition.metrics"];

function summarize(ev: Smart40Event): string {
  const d = ev.data as unknown as Record<string, unknown>;
  switch (ev.type) {
    case "connection.state": return String(d.status);
    case "machine.emergency": return d.active ? "EMERGÊNCIA ATIVA (simulada)" : "Emergência liberada";
    case "traceability.piece-scanned": return `${d.pieceId} → ${d.result}`;
    case "command.requested": return `${d.action} → ${d.target} (${d.originModule})`;
    case "command.ack": return `${d.status}: ${d.message}`;
    default: return "";
  }
}

/** Log dos eventos relevantes do barramento (telemetria periódica é omitida). */
export function useEventLog(limit = 12): LogEntry[] {
  const [log, setLog] = useState<LogEntry[]>([]);
  useEffect(() => {
    let seq = 0;
    let lastConn = "";
    const offs = EVENT_TYPES.filter((t) => !NOISY.includes(t)).map((t) =>
      onSmart40(t, (ev) => {
        if (ev.type === "connection.state") {
          const st = (ev as Smart40Event<"connection.state">).data.status;
          if (st === lastConn) return; // heartbeat: só loga mudança de status
          lastConn = st;
        }
        setLog((prev) =>
          [{ key: `${ev.eventId}-${seq++}`, type: ev.type, timestamp: ev.timestamp, source: ev.source, summary: summarize(ev) }, ...prev].slice(0, limit),
        );
      }),
    );
    return () => offs.forEach((off) => off());
  }, [limit]);
  return log;
}

export function usePathname(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("single-spa:routing-event", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("single-spa:routing-event", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  return path;
}
