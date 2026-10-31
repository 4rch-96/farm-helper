# Farm Profitability Calculator

## Objective
Build an advisory-only, browser-local Farming Season profitability calculator as a TypeScript React PWA.

## Problem and Why
Players need transparent guidance on farm profitability and market prices without game automation or session credential handling.

## Authorized Scope
- Local import and analysis of farm and manually exported market snapshots.
- Read-only anonymous RWA/chain context where verified.
- No wallet custody, `fs_session` persistence/replay, game mutations, or live authenticated market polling.

## Constraints
- Hexagonal architecture, DDD, SOLID.
- Package manager and script runner: Bun.
- Feature-branch chain delivery: core → safe adapters → PWA/UI.
- Strict TDD: false (source: `openspec/config.yaml`; no runner exists yet). Once task 1.1 creates the runner, use ordinary functional checks unless TDD configuration is explicitly changed.
- Engram mirror: pending; runtime identity is unavailable.

## Delivery
- Forecast: 850–1,150 authored changed lines.
- Strategy: auto-chain.
- Chain strategy: feature-branch-chain.
- Slice 1: workspace and calculation core.
- Slice 2: local import and public context.
- Slice 3: PWA UI and browser journey.

## Tasks
- [x] FPC-1 — Establish the Vite TypeScript workspace and pure calculation core with tests. Route: delegated; writer trigger (multiple non-trivial files).
- [ ] FPC-2 — Add secure local snapshot import and public-context adapters with tests. Route: delegated; writer trigger.
- [ ] FPC-3 — Deliver PWA calculator UI and end-to-end journey. Route: delegated; writer trigger.

## Acceptance Criteria
- Recommendations state formulas, fees, timestamps, inputs, and uncertainty.
- No behavior controls or queues an action in Farming Season.
- No session credential or secret is transmitted, persisted, or logged.
- Each slice has focused checks, runtime evidence, a work-unit commit, and rollback boundary.

## Progress
- 2026-10-30: Planning artifacts completed under `openspec/changes/farm-profitability-calculator/`.
- Next: initialize local Git repository and feature-chain branches, then implement FPC-1.

## Work Unit Evidence

### FPC-1 — Workspace and calculation core
- Focused check: `bun run test -- --run src/domain src/application` — passed (3 files, 10 tests).
- Runtime harness: `bun run build` — passed; Vite production PWA build completed.
- Rollback boundary: workspace configuration plus `src/domain/`, `src/application/`, and test fixtures/tests.
- TDD note: strict TDD is disabled; tests and implementation were completed with functional verification.
