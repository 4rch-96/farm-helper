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
- [x] FPC-1R — Correct reviewed profitability calculation reliability findings before FPC-2. Route: delegated; writer trigger (domain, application, and tests).
- [x] FPC-2 — Add secure local snapshot import and public-context adapters with tests. Route: delegated; writer trigger.
- [x] FPC-2R — Correct reviewed adapter reliability findings before FPC-3. Route: delegated; writer trigger (adapter code and tests).
- [x] FPC-3 — Deliver PWA calculator UI and end-to-end journey. Route: delegated; writer trigger.
- [x] FPC-4 — Verify and document local-only operation. Route: delegated; writer trigger (documentation and verification evidence).

## Acceptance Criteria
- Recommendations state formulas, fees, timestamps, inputs, and uncertainty.
- No behavior controls or queues an action in Farming Season.
- No session credential or secret is transmitted, persisted, or logged.
- Each slice has focused checks, runtime evidence, a work-unit commit, and rollback boundary.

## Progress
- 2026-10-30: Planning artifacts completed under `openspec/changes/farm-profitability-calculator/`.
- 2026-10-30: FPC-1 committed as `cbef738 feat(core): add profitability calculation foundation` and checks passed.
- 2026-10-30: Native review `review-cf37f71213471fb2` was acknowledged with three informational reliability findings; FPC-1R records their required correction before FPC-2.
- 2026-10-30: FPC-1R completed; payback, daily-cap handling, and comparable ranking are corrected and regression-tested.
- 2026-10-30: FPC-2 completed with browser-local snapshot normalization and anonymous public-context fallback checks.
- 2026-10-30: Native review `review-6269c0943ee3f5ab` was acknowledged with two informational adapter reliability findings; FPC-2R records their required correction before FPC-3.
- 2026-10-30: FPC-2R completed; client retrieval time and source update time are distinct, and credential-shaped fields are detected broadly without exposing values.
- 2026-10-30: FPC-3 completed with a local pixel-art calculator workspace, React UI tests, and an authored Playwright journey.
- 2026-10-30: FPC-4 completed. Unit/UI tests, typecheck, and production build pass; E2E is unavailable because Playwright Chromium is not installed and no browser download was authorized.
- Next: archive the completed change after its final review boundary is reconciled.

## Work Unit Evidence

### FPC-1 — Workspace and calculation core
- Focused check: `bun run test -- --run src/domain src/application` — passed (3 files, 10 tests).
- Runtime harness: `bun run build` — passed; Vite production PWA build completed.
- Rollback boundary: workspace configuration plus `src/domain/`, `src/application/`, and test fixtures/tests.
- TDD note: strict TDD is disabled; tests and implementation were completed with functional verification.
- Review receipt: `review-cf37f71213471fb2` acknowledged; advisory findings R3-001 through R3-003 are tracked as FPC-1R.

### FPC-1R — Reliability corrections
- Focused check: `bun run test -- --run src/domain src/application` — passed (3 files, 13 tests).
- Runtime harness: `bun run build` — passed; Vite production PWA build completed.
- Type check: `bun run typecheck` — passed.
- Rollback boundary: `src/domain/profitability/`, `src/application/use-cases/`, and their focused tests.
- Review assessment: medium risk, under budget (93 authored changed lines from `cbef738`); deferred within the current review slice.

### FPC-2 — Safe data adapters
- Focused check: `bun run test -- --run src/adapters` — passed (3 files, 8 tests).
- Full verification: `bun run test` — passed (6 files, 21 tests); `bun run typecheck` and `bun run build` — passed.
- Runtime harness: mocked anonymous public-context refresh, including timeout, authentication challenge, invalid payload, and stale-context paths.
- Rollback boundary: `src/adapters/` only.
- Review receipt: `review-6269c0943ee3f5ab` acknowledged; advisory findings R3-001 and R3-002 are tracked as FPC-2R.

### FPC-2R — Adapter reliability corrections
- Focused check: `bun run test -- --run src/adapters` — passed (3 files, 12 tests).
- Type check: `bun run typecheck` — passed.
- Runtime harness: `bun run build` — passed; Vite production PWA build completed.
- Rollback boundary: `src/adapters/http/`, `src/adapters/import/`, and their focused tests.


### FPC-3 — Pixel-art PWA UI
- Focused check: `bun run test -- --run src/presentation` — passed (1 file, 2 tests).
- Full verification: `bun run test` — passed (7 files, 27 tests); `bun run typecheck` and `bun run build` — passed.
- Runtime harness: production PWA build completed. `bun run e2e` was attempted but unavailable because the Playwright Chromium binary is not locally installed; no browser download was authorized.
- Rollback boundary: `src/presentation/`, `src/main.tsx`, `src/vite-env.d.ts`, and `playwright.config.ts`.
- Review assessment: medium risk, `under_budget` (252 authored changed lines from `d525a27`); review remains pending within the current slice.

### FPC-4 — Verification and documentation
- Full checks: `bun run test` — passed (7 files, 27 tests); `bun run typecheck` — passed; `bun run build` — passed.
- Browser journey: `bun run e2e` — unavailable/failed because Playwright Chromium is not installed locally. No browser download was attempted.
- Outbound-path review: only `FarmingSeasonPublicContextClient` may request the verified public RWA endpoint, always with `credentials: 'omit'`; no wallet/session/secret handling, game mutation, or live-listing claim was found.
- Rollback boundary: `README.md` and verification evidence in task artifacts.
- Review assessment: medium risk, `under_budget` (300 authored changed lines from `d525a27`); the current UI/documentation slice remains pending within the chain review budget.
