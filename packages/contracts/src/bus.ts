/**
 * Helpers do barramento para os módulos G2–G5.
 * Use estes helpers em vez de abrir WebSocket próprio (proibido).
 *
 *   const off = onSmart40("robot.telemetry", (ev) => setRobo(ev.data));
 *   // no unmount:
 *   off();
 */
import { busEventName, SCHEMA_VERSION, type Smart40Event, type Smart40EventType } from "./events";
import type { CommandRequested } from "./payloads";

export function onSmart40<T extends Smart40EventType>(
  type: T,
  handler: (event: Smart40Event<T>) => void,
  target: Window = window,
): () => void {
  const name = busEventName(type);
  const listener = (e: Event) => handler((e as CustomEvent<Smart40Event<T>>).detail);
  target.addEventListener(name, listener);
  return () => target.removeEventListener(name, listener);
}

export function newEventId(prefix = "evt"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${rnd}`;
}

export function makeEvent<T extends Smart40EventType>(
  type: T,
  data: Smart40Event<T>["data"],
  source: Smart40Event["source"],
  eventId = newEventId(type),
): Smart40Event<T> {
  return { schemaVersion: SCHEMA_VERSION, eventId, type, timestamp: new Date().toISOString(), source, data };
}

export function publishSmart40<T extends Smart40EventType>(event: Smart40Event<T>, target: Window = window): void {
  target.dispatchEvent(new CustomEvent(busEventName(event.type), { detail: event }));
}

/** Envia um comando simulado. O Shell (G1) responde com "command.ack". */
export function requestCommand(
  cmd: Omit<CommandRequested, "commandId" | "simulation"> & { commandId?: string },
  target: Window = window,
): string {
  const commandId = cmd.commandId ?? newEventId("cmd");
  publishSmart40(makeEvent("command.requested", { ...cmd, commandId, simulation: true }, "ui"), target);
  return commandId;
}

/** API global exposta pelo Shell (window.smart40) para módulos que montam depois. */
export interface Smart40ShellApi {
  schemaVersion: string;
  getLast<T extends Smart40EventType>(type: T): Smart40Event<T> | undefined;
}

declare global {
  interface Window {
    smart40?: Smart40ShellApi;
  }
}
