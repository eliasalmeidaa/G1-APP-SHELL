import type { MouseEvent, ReactNode } from "react";
import { navigateToUrl } from "single-spa";
import { MODULE_ROUTES } from "../config/routes";
import { useLastEvent, usePathname } from "../hooks/useBus";
import { ConnectionPill } from "./ConnectionPill";

const NAV = [{ path: "/", label: "Visão geral", group: 1 }, ...MODULE_ROUTES];

function go(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  navigateToUrl(e.currentTarget.href);
}

export function Layout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const emergency = useLastEvent("machine.emergency");

  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand">
          <span className="shell__logo" aria-hidden="true">S4</span>
          <div>
            <div className="shell__name">SMART 4.0</div>
            <div className="shell__sub">Planta N2 · Supervisório Web</div>
          </div>
        </div>
        <div className="shell__status">
          <span className="sim-badge" title="Sprint 1: nenhum comando chega ao hardware">Simulação</span>
          <ConnectionPill />
        </div>
      </header>

      {emergency?.data.active && (
        <div className="estop-banner" role="alert">
          <strong>Parada de emergência ativa (simulada)</strong>
          <span>O botão da tela é informativo e não substitui o E-Stop físico nem o circuito de segurança do CLP.</span>
        </div>
      )}

      <nav className="shell__nav" aria-label="Módulos">
        {NAV.map((n) => {
          const active = n.path === "/" ? path === "/" : path.startsWith(n.path);
          return (
            <a key={n.path} href={n.path} onClick={go} className="shell__tab" aria-current={active ? "page" : undefined}>
              <span className="shell__tab-group">G{n.group}</span>
              {n.label}
            </a>
          );
        })}
      </nav>

      <main className="shell__main">{children}</main>

      <footer className="shell__footer">
        Contrato v0.1 · Dados sintéticos (MOCK) · Sprint 1 — sem escrita em CLP/robô/esteira
      </footer>
    </div>
  );
}
