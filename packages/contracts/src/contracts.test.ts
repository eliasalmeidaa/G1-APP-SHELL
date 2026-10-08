import { describe, expect, it, vi } from "vitest";
import { allFixtures, machineRunning } from "./fixtures";
import { isSmart40Event, onSmart40, publishSmart40, requestCommand, validateCommand } from "./index";

describe("contrato v0.1", () => {
  it("todas as fixtures passam no validador de envelope", () => {
    for (const f of allFixtures) expect(isSmart40Event(f), f.eventId).toBe(true);
  });

  it("rejeita envelope com tipo desconhecido, versão errada ou timestamp inválido", () => {
    expect(isSmart40Event({ ...machineRunning, type: "foo.bar" })).toBe(false);
    expect(isSmart40Event({ ...machineRunning, schemaVersion: "9.9.9" })).toBe(false);
    expect(isSmart40Event({ ...machineRunning, timestamp: "ontem" })).toBe(false);
    expect(isSmart40Event(null)).toBe(false);
  });

  it("comando sem simulation:true é rejeitado", () => {
    const r = validateCommand({ commandId: "c1", target: "MACHINE", action: "START", originModule: "ihm", simulation: false });
    expect(r.ok).toBe(false);
  });

  it("onSmart40 entrega o envelope e o unsubscribe remove o listener", () => {
    const fn = vi.fn();
    const off = onSmart40("machine.telemetry", fn);
    publishSmart40(machineRunning);
    off();
    publishSmart40(machineRunning);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].data.status).toBe("RUNNING");
  });

  it("requestCommand sempre marca simulation:true", () => {
    const fn = vi.fn();
    const off = onSmart40("command.requested", fn);
    const id = requestCommand({ target: "MACHINE", action: "STOP", originModule: "ihm" });
    off();
    expect(fn.mock.calls[0][0].data).toMatchObject({ commandId: id, simulation: true });
  });
});
