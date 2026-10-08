/**
 * Tela "ATENÇÃO — ESTA TELA ESTÁ EM PRODUÇÃO".
 * Montada pelo Single-SPA quando o módulo remoto do grupo ainda não está publicado.
 * Também serve de EXEMPLO de ciclo de vida correto (bootstrap/mount/unmount com limpeza).
 */
import { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { onSmart40, type Smart40EventType } from "@smart40/contracts";
import { StatusLed } from "@smart40/ui";
import type { ModuleRoute } from "../config/routes";

interface Props {
  route: ModuleRoute;
  expectedUrl: string | null;
  reason: string;
}

function useBusPulse(types: Smart40EventType[]) {
  const [count, setCount] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => {
    const offs = types
      .filter((t) => t !== "connection.state" && t !== "command.ack")
      .map((t) =>
        onSmart40(t, (ev) => {
          setCount((c) => c + 1);
          setLast(ev.timestamp);
        }),
      );
    return () => offs.forEach((off) => off()); // limpeza obrigatória no unmount
  }, [types]);
  return { count, last };
}

function UnderConstruction({ route, expectedUrl, reason }: Props) {
  const { count, last } = useBusPulse(route.consumes);
  return (
    <section className="wip" aria-labelledby="wip-title">
      <div className="wip__stripe" aria-hidden="true" />
      <div className="wip__body">
        <svg className="wip__icon" viewBox="0 0 64 56" aria-hidden="true">
          <path d="M32 3 L61 53 H3 Z" fill="var(--smart-hazard-yellow)" stroke="var(--smart-hazard-black)" strokeWidth="3" strokeLinejoin="round" />
          <rect x="29" y="19" width="6" height="19" rx="2" fill="var(--smart-hazard-black)" />
          <circle cx="32" cy="45" r="3.5" fill="var(--smart-hazard-black)" />
        </svg>
        <p className="wip__eyebrow">Atenção</p>
        <h1 id="wip-title" className="wip__title">Esta tela está em produção</h1>
        <p className="wip__lead">
          O módulo <strong>{route.title}</strong> está sendo desenvolvido pelo <strong>Grupo {route.group}</strong> e
          ainda não foi publicado no App Shell.
        </p>

        <dl className="wip__facts">
          <div>
            <dt>Módulo</dt>
            <dd><code>{route.app}</code></dd>
          </div>
          <div>
            <dt>URL esperada (importmap)</dt>
            <dd><code>{expectedUrl ?? "não definida"}</code></dd>
          </div>
          <div>
            <dt>Vai consumir</dt>
            <dd className="wip__chips">
              {route.consumes.map((t) => <code key={t} className="wip__chip">smart40:{t}</code>)}
            </dd>
          </div>
          <div>
            <dt>Barramento</dt>
            <dd>
              {count > 0 ? (
                <StatusLed color="green" label={`${count} eventos recebidos · último ${new Date(last!).toLocaleTimeString("pt-BR")}`} />
              ) : (
                <StatusLed color="yellow" blink label="Aguardando telemetria do simulador" />
              )}
            </dd>
          </div>
        </dl>

        <p className="wip__reason">Motivo técnico: {reason}</p>
      </div>
      <div className="wip__stripe" aria-hidden="true" />
    </section>
  );
}

/** Ciclo de vida Single-SPA do placeholder. */
export function createPlaceholderApp(route: ModuleRoute, expectedUrl: string | null, reason: string) {
  let root: Root | null = null;
  return {
    bootstrap: async () => {},
    mount: async (props: { domElement?: HTMLElement | null }) => {
      const el = props.domElement;
      if (!el) throw new Error("domElement ausente");
      root = createRoot(el);
      root.render(<UnderConstruction route={route} expectedUrl={expectedUrl} reason={reason} />);
    },
    unmount: async () => {
      root?.unmount(); // desmonta React → roda os cleanups (removeEventListener)
      root = null;
    },
  };
}
