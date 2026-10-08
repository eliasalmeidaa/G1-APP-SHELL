import { EVENT_TYPES, SCHEMA_VERSION, type Smart40Event, type Smart40EventType } from "./events";
import type { CommandRequested } from "./payloads";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Valida o envelope. Payload inválido deve ser descartado/logado sem travar o Shell. */
export function isSmart40Event(v: unknown): v is Smart40Event {
  return (
    isObj(v) &&
    v.schemaVersion === SCHEMA_VERSION &&
    typeof v.eventId === "string" &&
    typeof v.type === "string" &&
    (EVENT_TYPES as readonly string[]).includes(v.type) &&
    typeof v.timestamp === "string" &&
    !Number.isNaN(Date.parse(v.timestamp)) &&
    typeof v.source === "string" &&
    isObj(v.data)
  );
}

export function isEventOfType<T extends Smart40EventType>(
  v: unknown,
  type: T,
): v is Smart40Event<T> {
  return isSmart40Event(v) && v.type === type;
}

/** Regra da Sprint 1: só aceita comando com simulation === true e campos obrigatórios. */
export function validateCommand(v: unknown): { ok: true; cmd: CommandRequested } | { ok: false; reason: string } {
  if (!isObj(v)) return { ok: false, reason: "Comando não é um objeto" };
  if (typeof v.commandId !== "string" || !v.commandId) return { ok: false, reason: "commandId ausente" };
  if (typeof v.target !== "string") return { ok: false, reason: "target ausente" };
  if (typeof v.action !== "string") return { ok: false, reason: "action ausente" };
  if (typeof v.originModule !== "string") return { ok: false, reason: "originModule ausente" };
  if (v.simulation !== true) return { ok: false, reason: "Sprint 1 aceita apenas simulation: true" };
  return { ok: true, cmd: v as unknown as CommandRequested };
}
