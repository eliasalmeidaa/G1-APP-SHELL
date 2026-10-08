# SMART 4.0 · Planta N2 — Front-End (Sprint 1)

Monorepo da turma. **Grupo 1** é custodiante de `apps/shell`, `packages/contracts`, `packages/ui` e `mock/`.

> ⚠️ Sprint 1 é **simulação**. Nenhum comando chega a CLP, robô ou esteira. O E-Stop da tela é informativo e **não substitui o E-Stop físico**.

## Rodar (Codespaces ou local, Node 20)

```bash
npm install
npm run mock     # terminal 1 → ws://localhost:8080 (simulador do professor)
npm run dev      # terminal 2 → http://localhost:9000 (App Shell)
```

| Comando | O que faz |
|---|---|
| `npm run lint` | typecheck de todos os pacotes |
| `npm test` | testes (contrato + GatewayClient) |
| `npm run build` | build do Shell → `apps/shell/dist` |
| `npm run check:secrets` | procura IP privado/segredo no bundle |

Em `npm run dev` o Shell já usa o token de mock `aluno-token-grupo1`. Para outro token, copie `.env.example` para `apps/shell/.env.local`.

## Estrutura

```text
apps/shell/          [G1] Host Single-SPA, navegação, GatewayClient, tela "em produção"
packages/contracts/  [G1] Tipos, envelope Smart40Event, helpers do barramento, fixtures
packages/ui/         [G1] theme.css (professor) + componentes: IndustrialButton, StatusLed, DataTable, AlertBanner
mock/                [G1] mock_server_smart40.js (professor, sem alteração)
.devcontainer/       Node 20, portas 8080/9000/8081–8084
```

## Rotas e módulos

| Rota | Módulo (importmap) | Grupo | URL dev |
|---|---|---|---|
| `/` | Visão geral (do Shell) | G1 | — |
| `/operacao` | `@smart40/ihm-siemens` | G2 | http://localhost:8081/smart40-ihm-siemens.js |
| `/robo` | `@smart40/robo-ur` | G3 | http://localhost:8082/smart40-robo-ur.js |
| `/rastreabilidade` | `@smart40/rastreabilidade-qrcode` | G4 | http://localhost:8083/smart40-rastreabilidade.js |
| `/expedicao` | `@smart40/expedicao-oee` | G5 | http://localhost:8084/smart40-expedicao-oee.js |

Endpoints do Shell: `/importmap.json` e `/api/app-shell/routes`.

**Enquanto o módulo de um grupo não responde na URL, o Shell mostra a tela "ATENÇÃO — ESTA TELA ESTÁ EM PRODUÇÃO".** Quando o bundle aparece, ele é montado no lugar automaticamente. Nunca fica `SKIP_BECAUSE_BROKEN`.

O Shell aceita bundles **SystemJS** (`System.register`, padrão do create-single-spa) **ou ES Module** (Vite). O bundle precisa exportar `bootstrap`, `mount` e `unmount`. O Shell entrega `props.domElement`: monte nele.

Para apontar um módulo para outra URL sem mexer no repo: `localStorage.setItem('devtools', true)`, recarregar e usar o painel do import-map-overrides (canto inferior direito).

No console (dev): `smart40Apps()` mostra o status Single-SPA de cada módulo.

## Barramento — como os Grupos 2–5 consomem

**Proibido abrir WebSocket próprio.** O Shell mantém a única conexão e publica `window` events `smart40:<type>` com o envelope:

```ts
{ schemaVersion: "0.1.0", eventId, type, timestamp /* ISO UTC */, source: "mock" | "shell" | "ui", data }
```

| Evento | Quem consome | `data` |
|---|---|---|
| `smart40:machine.telemetry` | G2 | status, mode, emergencyActive, safetyInterlockOk, conveyorSpeedPercent, pneumaticPressureBar, alarms |
| `smart40:machine.emergency` | todos | `{ active, simulated: true }`, publicado na transição |
| `smart40:robot.telemetry` | G3 | jointsDeg[6] (°), tcp (mm/°), gripper, programName, programRunning, motorTemperatureC |
| `smart40:traceability.piece-scanned` | G4 | pieceId, qrCode, lot, scannedAt, result, surfaceQualityPercent, reason. **Uma vez por peça.** |
| `smart40:expedition.metrics` | G5 | totalProduced/Approved/Rejected, piecesPerMinute, outputQueueSize, oeePercentMock, `isMock: true` |
| `smart40:connection.state` | todos | CONNECTING / CONNECTED / DISCONNECTED / STALE, lastTelemetryAt, latencyMs (heartbeat 1 s) |
| `smart40:command.requested` | Shell | emitido pelos módulos (use `requestCommand`) |
| `smart40:command.ack` | quem enviou | `{ commandId, status: SIMULATED \| REJECTED, message }` |
| `smart40:telemetria` | legado | payload cru do mock (compatível com o Guia Completo) |

```ts
import { onSmart40, requestCommand } from "@smart40/contracts";

// mount
const off = onSmart40("robot.telemetry", (ev) => render(ev.data.jointsDeg));
const id = requestCommand({ target: "MACHINE", action: "START", originModule: "ihm" }); // simulation:true automático

// unmount (obrigatório)
off();
```

Regras do contrato: campo sem dado é `null` → exibir **N/D**, nunca 0. Com `connection.state` ≠ CONNECTED, mostrar STALE/UNKNOWN e bloquear botões de movimento. Fixtures prontas: `import { robotRunning, machineEmergency } from "@smart40/contracts/fixtures"`.

Mudança que quebra o contrato → PR no `packages/contracts`, versão nova e aprovação dos 5 grupos.

## Comandos (dry-run)

Módulo emite `command.requested` → Shell valida (`simulation: true` obrigatório; sem conexão = REJECTED) → encaminha `START/STOP/RESET/EMERGENCY_STOP` ao mock no formato `{ acao, origem }` → publica `command.ack` SIMULATED. Ações que o mock não conhece (JOG, MANUAL_SCAN…) recebem ACK SIMULATED só na interface.

## Medido no teste local

- Queda do simulador detectada em ~35 ms (SLA < 200 ms) · reconexão < 3 s (backoff máx. 2,5 s)
- Troca de rotas ×15: 0 `SKIP_BECAUSE_BROKEN`, 0 exceções
- Bundle sem IP privado/segredo (`npm run check:secrets`)

## Segurança (runbook, seção 8)

- Nada de `192.168.x.x`, senha, token real ou Basic auth em código, `.env` público ou localStorage.
- O token do mock é de sala de aula; o build de produção só o inclui se `VITE_SMART40_WS_TOKEN` for definido.
- Integração real só na Sprint 2+, via gateway no backend.
