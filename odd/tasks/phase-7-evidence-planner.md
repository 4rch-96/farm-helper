# Phase 7 — Evidence-Based Farming Season Planner

- **Issue:** #9 — `feat: Phase 7 evidence-based Farming Season planner`
- **Branch:** `codex/phase-7-evidence-planner`
- **Base:** `main` at `d6fe37f`
- **Status:** planned; no functional code written

## Objective
Replace the unusable “Unranked” matrix with a legible Farming Season planning workspace that compares crops, animals, processing, and orders only when their costs, time, energy, and rewards are backed by compatible, traceable evidence.

## Problem and Why
The visible `FarmingSeasonDocumentationCatalog` deliberately supplies unknown economic facts, so `BuildEconomyMatrix` cannot rank alternatives. Phase 6 already added official-guide mechanics, local privacy-preserving capture importers, observed-action records, and an observed-profitability use case; the main UI does not consume that capability. The current table is therefore technically honest but not useful to a player.

## Authorized Scope
- Reuse the Phase 6 official guide, local-only importers, observed data model, complete-only calculations, and SEASON/USD context.
- Replace the matrix-first UI with an accessible, responsive planner grouped by crops, animals, processing, and orders.
- Show net benefit, ROI, benefit per energy, and benefit per hour only when every required value has compatible units and provenance.
- Show source kind, source reference, observed/review date, confidence, and exact missing facts for every decision state.
- Surface recipes (for example bread, cheese, butter, jam) and orders as evidence-pending until official or player-observed inputs, outputs, duration, energy, costs, and rewards are available; never estimate or rank them otherwise.
- Keep Town Hall choices at officially verified levels 1–5. Do not show Town Hall 6–7 as available.
- Keep SEASON/USD separate from in-game reward conversion; it must never predict the number of in-game tokens paid.
- Preserve the privacy boundary: never retain raw captures, cookies, wallets, private cURLs, session material, tokens, credentials, or automated game actions.

## Constraints and Evidence
- Canonical public mechanics source: https://farmingseason.io/docs, reviewed 2026-11-01.
- The official guide verifies Town Hall 1–5, energy, crop growth time, animal cadence/feed, feed conversion, capacities, and market fees. It does **not** publish individual crop/animal prices, recipe definitions for bread/cheese/butter/jam, workshop operations, or individual order rewards.
- Local capture evidence remains scoped and dated; it cannot become a universal rule or be used without unit compatibility.
- Issue #9 is open with `enhancement` and `status:approved`.

## Visual and Interaction Direction
- **Visual thesis:** a calm, high-contrast farm ledger with warm harvest accents and readable game-like material cues, designed for decisions rather than a dense dashboard.
- **Content plan:** planning status and Town Hall context; primary alternative list; selected decision detail with formula/provenance; explicit evidence gap and safe local-data workflow.
- **Interaction thesis:** intentional category switching, a clear selection transition, and restrained hover/focus feedback; all animation respects reduced-motion preferences.

## TDD and Verification Configuration
- **TDD:** disabled.
- **Source:** `openspec/config.yaml` (`strict_tdd: false`, `rules.apply.tdd: false`).
- **Focused runner:** `bun test` / `vitest run` for the affected tests.
- **Closure checks:** `bun run test`, `bun run typecheck`, `bun run build`, `git diff --check`; browser/accessibility scenarios where feasible.

## Delivery
- **Forecast:** approximately 850 authored changed lines across application calculations, import/UI integration, presentation, tests, and documentation.
- **Strategy:** `single-pr`.
- **Maintainer delivery direction:** one feature branch with separate, reviewable work-unit commits and one final PR to `main`; this is the maintainer-approved exception to the ~400-line PR forecast. The required `size:exception` PR label remains pending until an exact PR number exists and the maintainer directs that protected-label action.
- **Running authored lines:** 0.
- **RDD:** enabled by global configuration; assess each work-unit commit against the current reviewed boundary using the native command.
- **Engram mirror:** pending because this runtime has no registered memory session identity; local document is authoritative until it can be mirrored safely.

## Tasks
- [x] **P7-1 — Evidence-safe planning model and calculations.** Route: delegated. Trigger evidence: the change spans the guide/capture domain, planner use case, calculation tests, and current observation integration (4+ files; writer trigger). Complete alternatives now require sourced, unit-compatible observed game-token values; crop seed cost uses a documented local input key, and every missing or incompatible input blocks ranking with an exact reason. **Evidence:** `dd10007` (`feat(planner): derive sourced crop and animal metrics`); focused 8-test suite, typecheck, and `git diff --check` passed. Native RDD assessment: medium / `under_budget` (356 candidate lines including this tracking file), so the review boundary remains `d6fe37f`. **Rollback boundary:** planner use case, supporting domain types, importer projection, and their tests.
- [x] **P7-2 — Local-only planner data workflow.** Route: delegated. Trigger evidence: UI wiring spans import adapters, application state, calculator composition, and tests (writer trigger). `8f2bce9` clears source JSON, rejects credential/wallet/private-request input, and accepts dated crop-cost evidence; `88cb665` resets all dependent draft state before every replacement capture so stale evidence cannot cross farms. **Evidence:** focused importer/component suite (10 tests), typecheck, and `git diff --check` passed. Native review `review-dca0e2d6ae605df4` was granted, completed, and acknowledged; its advisory R3-001 was fixed in `88cb665`. The correction's native assessment is medium / `under_budget` against reviewed boundary `8f2bce9`. **Acceptance:** local evidence can produce an observed, dated plan; unsafe/unsupported input is rejected; replacement captures cannot inherit unsaved evidence; SEASON/USD remains non-predictive. **Rollback boundary:** local data workflow components, adapters, and tests.
- [ ] **P7-3 — Readable game-inspired planner interface.** Route: delegated. Trigger evidence: calculator shell, alternative list/detail, evidence presentation, CSS, accessibility tests, and browser coverage are multiple non-trivial files (mapping/writer trigger). Replace the matrix/table with grouped decision surfaces and clear unavailable states. **Acceptance:** desktop and mobile readability, keyboard operation, reduced motion, visible provenance, and Town Hall 1–5 only. **Checks:** component/accessibility tests, e2e where feasible, typecheck, build. **Rollback boundary:** calculator presentation and related tests/styles.
- [ ] **P7-4 — Evidence and verification documentation.** Route: delegated. Trigger evidence: public guide/evidence docs and task record are multiple files (writer trigger). Document source boundaries, formulas, local-data instructions, and verified results. **Acceptance:** no unsupported claims or reward predictions; user can identify required evidence and reproduce checks. **Checks:** documentation review, full suite, typecheck, build, `git diff --check`. **Rollback boundary:** Phase 7 documentation and task evidence.

## Progress
- 2026-11-01: verified `main` at `d6fe37f`, researched the official guide, completed a duplicate search, and created approved issue #9.
- 2026-11-01: created this Phase 7 ODD document before functional writes; maintainer selected one feature branch, separate work-unit commits, and one final PR.
- 2026-11-01: completed P7-1 in `dd10007`; it derives crop and animal comparison metrics only from compatible observed game-token values and labels official, observed, and unknown evidence explicitly.
- 2026-11-01: completed P7-2 in `8f2bce9` and `88cb665`; raw input is ephemeral, privacy-sensitive request material is rejected, and capture replacement clears all unrecorded evidence drafts.

## Next Step
Start P7-3 with a bounded delegated implementation task.
