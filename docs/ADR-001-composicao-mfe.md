# ADR-001 — Composição de micro-frontends (Sprint 1)

**Status:** proposto pelo G1 (aprovar no Dia 1) · **Data:** 07/10/2026

## Decisão
- Stack: React 18 + TypeScript + Vite, Node 20, npm workspaces.
- Composição: **Single-SPA + Import Maps (SystemJS)**, conforme o guia. Um único orquestrador.
- O Shell aceita bundles SystemJS ou ESM e cai para a tela "em produção" quando o remoto não existe.
- Barramento: `window` CustomEvents `smart40:<type>` com envelope `Smart40Event` v0.1. Uma única conexão WebSocket (GatewayClient no Shell).

## Fallback
Se o remoto de algum grupo não carregar até o Dia 3, o grupo publica o módulo como pacote local do monorepo e o Shell o registra localmente. Retomar a composição remota em ADR posterior.

## Consequências
- Grupos G2–G5 dependem só de `@smart40/contracts` e `@smart40/ui`.
- O mock do professor não usa o envelope: o Shell faz a adaptação (`apps/shell/src/gateway/adapter.ts`). Quando houver gateway real, só o adaptador muda.
