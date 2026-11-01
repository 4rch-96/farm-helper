# Farming Season Profitability Planner

## Objective
Turn Field Ledger from an evidence-placeholder screen into a readable, game-informed Farming Season planning workspace that uses the official player guide, helps players decide what they can do at their Town Hall level, and calculates/ranks profitability only when current value inputs are present.

## Problem and Why
The current catalog intentionally contains only `unknown` placeholders. It never records the official guide's level, energy, crop-cycle, animal, feed, capacity, unlock, market-fee, fishing, Mine, or Oil Well rules. Consequently every row is incomplete and unranked, while the interface presents technical evidence gaps rather than actionable gameplay choices.

## Authorized Scope
- Treat https://farmingseason.io/docs as the canonical public guide, read-only and without credentials.
- Capture all directly documented Farming Season gameplay facts with provenance and a factual date.
- Model Town Hall levels 1–5 exactly as documented; do not claim levels 6–7, which the official guide does not document.
- Replace the placeholder-only experience with an understandable, game-like profitability workspace.
- Accept a player-provided, local-only game/market capture and extract only the operational and economic observations required for planning; never persist identity, wallet, referral, session, telemetry, or raw capture data.
- Let a player enter or update any remaining current in-game values required for exact profit calculations; never invent values absent from the guide.
- Document the guide, data model, calculations, freshness, source limits, and how the player supplies values.

## Constraints
- The official guide says its season numbers can change and the game shows current values; static guide data must retain source and review date.
- The guide does not state crop payouts, seed/building/animal costs, feed price, activity yields, current reward share, or current Chainlink-derived price. Exact monetary profitability must remain unavailable until those values are supplied or observed in a compatible local capture.
- Player-provided captures are observations, not a canonical global price feed. Market listings must retain their timestamp and unit-validation state; they cannot be combined with in-game payout logs until their price unit is confirmed.
- When an ordered before/after capture and an operation receipt disagree with a general guide rule, preserve both pieces of provenance and use the direct observation only for the captured action context; do not silently generalize it.
- No game automation, wallet access, credentials, authenticated polling, purchase/sale action, or fabricated economics.
- Preserve local-only operation and source-aware architecture.
- Engram mirror: pending because runtime identity is unavailable.

## Product Design
- **Visual thesis:** A legible farm ledger inspired by Farming Season's pixel-farm vocabulary—sunlit paper, soil, crop-green and barn-red accents—while keeping the operational surface dense and accessible.
- **Content plan:** (1) selected farm level and clear daily constraints; (2) “best next work” rankings when enough values exist; (3) activity guide with cycles, energy and requirements; (4) a transparent current-value input and source status area.
- **Interaction thesis:** Town Hall changes update the farm plan immediately; activity rows reveal their economics and constraints; status/selection transitions use restrained CSS motion with reduced-motion support.

## Delivery
- Forecast: 1,200–1,800 authored changed lines across data, calculation, UI, tests, and documentation.
- Strategy: `auto-chain`; chain strategy: `feature-branch-chain` (reusing the accepted project delivery convention).
- Initial work units: guide data/model → current-value calculations → planner UI → documentation and verification.
- Engram mirror is pending because the runtime identity is unavailable.

## Tasks
- [x] FSP-1 — Replace the placeholder Town Hall and activity facts with an official-guide-backed operational catalog for Town Hall, crops, animals, feed, orchard, Mine, Oil Well, fishing and market rules. Route: delegated; mapping trigger: domain, adapter, use-case, tests, source documentation, and legacy policy exceed four files. TDD: disabled by `openspec/config.yaml`; runner: focused Bun/Vitest suite. Acceptance: documented facts render as source-backed data; undisclosed prices/costs remain explicit gaps. Rollback boundary: guide domain/adapter, guide documentation, and focused tests.
- [x] FSP-2 — Add a privacy-preserving local capture importer for player-provided `/api/farm` and market-listing responses, then construct complete-only profitability calculations/rankings from unit-compatible observed data and remaining manual current values. Route: delegated; writer trigger: domain, application, adapter, presentation inputs, and tests are multiple non-trivial files. TDD: disabled by `openspec/config.yaml`; runner: focused Bun/Vitest suite. Acceptance: discard identity/session/referral/telemetry and raw capture content; extract source/timestamped farm state, observed in-game payouts/costs, and market aggregates; calculate net/cycle, net/hour and net/energy only from complete unit-compatible inputs; distinguish game-bank versus player-market fees; never rank incomplete or unit-unvalidated values. Rollback boundary: capture schema/importer, calculator/use case, and focused tests.
- [x] FSP-2.1 — Add ordered local action-observation import so before/after snapshots and operation receipts reveal observed energy, token, inventory, and field-state deltas without retaining raw captures. Route: delegated; writer trigger: observation domain, importer, profitability use case, and tests are multiple non-trivial files. TDD: disabled by `openspec/config.yaml`; runner: focused Bun/Vitest suite. Acceptance: model batch operations explicitly; derive an action fact only from an ordered compatible pair; retain source/timestamp/context; surface guide-versus-observation conflicts; never generalize an observation outside its captured context. Rollback boundary: observation domain/importer/use case and focused tests.
- [ ] FSP-3 — Replace the current matrix UI with an accessible, readable Farming Season planner surface that explains status, routes players to the data they need, and displays documented game mechanics and complete rankings. Route: delegated; writer trigger: multiple components, styles and tests. TDD: disabled by `openspec/config.yaml`; runner: calculator component suite and browser scenario where available. Acceptance: readable desktop/mobile text, clear zero-data guidance, Town Hall 1–5 options, useful activity cards/table, current-value entry, and reduced-motion support. Rollback boundary: calculator presentation files and tests.
- [ ] FSP-4 — Publish the source guide, data-map documentation, calculation assumptions, player input instructions, and verified project behavior. Route: delegated; writer trigger: user documentation, evidence document, test evidence and recovery record span multiple files. TDD: disabled by `openspec/config.yaml`; runner: full test/typecheck/build and `git diff --check`. Acceptance: every supported fact is traceable to an official-guide section; data gaps and input workflow are clear; verification evidence is accurate. Rollback boundary: documentation and verification records.

## Source Study Record
- 2026-11-01: Completed five complete thematic passes over the public Farming Season player guide: onboarding/energy; crops/animals/feed; Town Hall/daily-economy; bank/assets/market; and player systems/safety/season-change limits. The guide documents Town Hall levels 1–5—not 7.
- Primary source: https://farmingseason.io/docs (official player guide, accessed 2026-11-01).

## Acceptance Criteria
- A player immediately understands what actions are available at the selected Town Hall level and why.
- Documented mechanics are displayed as actual source-backed facts, not placeholder gaps.
- Exact profit rankings are shown only after all relevant current values are supplied; otherwise the UI says exactly what is missing and where it comes from.
- The planner compares crops, animals, feed, orchard, Mine, Oil Well, fishing and player-market opportunities within the documented limits.
- The UI is legible, responsive and visually aligned with the game without impersonating or automating it.

## Progress
- 2026-11-01: Created from explicit user authorization after the initial evidence-placeholder UI was rejected.
- 2026-11-01: The user supplied private local farm/market response captures. Read-only audit found current farm state, recent in-game payout/cost observations, and 1,946 active market listings across 18 items. Raw captures contain identifiers and must not enter the repository. Market listing price units conflict with observed feed purchase values, so the model must represent them as unit-validation-pending rather than treating them as interchangeable with direct game payouts.
- 2026-11-01: The user supplied two ordered operation receipts with before/after farm snapshots. The wheat harvest moved 24 units to the silo with no direct token gain; the cauliflower batch planting had no token delta. Their observed energy deltas do not match the guide’s per-field wording, so batch action energy must be modeled as a captured context rather than inferred from the guide.

## Work-unit Evidence
- 2026-11-01: FSP-1 implemented as an immutable official-guide mechanics model and adapter. It records Town Hall 1–5, daily energy/actions, 20 documented crop cycles, animal/feed/building rules, orchard cadence, Mine/Oil, fishing distributions, market constraints/fees, and Farm Bank fee with guide-section provenance. It intentionally does not add undocumented token payouts, costs, yields, or rankings. Verification: `bun run test` — 18 files / 83 tests passed; `bun run typecheck` — passed; `bun run build` — passed; `git diff --check` — passed for tracked changes and explicit untracked checks. Rollback boundary: `src/domain/guide/`, `src/adapters/guide/`, `docs/farming-season-guide.md`, and its focused test. Work-unit commit: `ce7e282` (`feat(guide): add official game mechanics catalog`). Native assessment: medium / slice-budget-reached; review consent pending.

- 2026-11-01: FSP-2 implemented a whitelist-only local-capture projection, observed direct-game payout and feed-cost extraction, market listing aggregation with `unit-validation-pending`, and a complete-only animal operating-margin plan. No attachment, wallet, identifier, name, referral, session, telemetry value, free-form log text, or raw JSON enters repository output. Verification: `bun run test` — 20 files / 88 tests passed; `bun run typecheck` — passed; `bun run build` — passed; `git diff --check` — passed. Rollback boundary: `src/domain/observations/`, `src/adapters/import/JsonLocalGameCaptureImporter.*`, `src/application/use-cases/BuildObservedProfitabilityPlan.*`, and the FSP-2 task record. Work-unit commit: `634158d` (`feat(profitability): import local game observations`).
- 2026-11-01: FSP-2.1 implemented ordered, privacy-preserving batch-action observations for harvest-to-silo and planting. It projects timestamped quantity, energy/token, silo and field deltas; it displays the guide-energy comparison as a context-specific observation only. Verification: `bun run test` — 22 files / 91 tests passed; `bun run typecheck` — passed; `bun run build` — passed; `git diff --check` — passed. Rollback boundary: `src/domain/observations/`, `src/adapters/import/JsonLocalActionObservationImporter.*`, `src/application/use-cases/BuildObservedProfitabilityPlan.*`, and the FSP-2.1 task record. Work-unit commit: pending.

## Next Step
- Implement FSP-2.1: ordered action observations, then use them in the Farm Strategy Board.
