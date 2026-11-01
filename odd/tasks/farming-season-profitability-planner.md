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
- Let a player enter or update current in-game values required for exact profit calculations; never invent values absent from the guide.
- Document the guide, data model, calculations, freshness, source limits, and how the player supplies values.

## Constraints
- The official guide says its season numbers can change and the game shows current values; static guide data must retain source and review date.
- The guide does not state crop payouts, seed/building/animal costs, feed price, activity yields, current reward share, or current Chainlink-derived price. Exact monetary profitability must remain unavailable until those values are supplied.
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
- [ ] FSP-2 — Add a local current-value snapshot and profitability calculations/rankings that only activate for a complete player-supplied price/cost basis. Route: delegated; writer trigger: domain, application, adapter, presentation inputs, and tests are multiple non-trivial files. TDD: disabled by `openspec/config.yaml`; runner: focused Bun/Vitest suite. Acceptance: calculate net/cycle, net/hour and net/energy from user-entered current values, distinguish game-bank versus player-market fees, and never rank incomplete values. Rollback boundary: snapshot schema, calculator/use case, and focused tests.
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
- 2026-11-01: Created from explicit user authorization after the initial evidence-placeholder UI was rejected. No source implementation has started.

## Work-unit Evidence
- 2026-11-01: FSP-1 implemented as an immutable official-guide mechanics model and adapter. It records Town Hall 1–5, daily energy/actions, 20 documented crop cycles, animal/feed/building rules, orchard cadence, Mine/Oil, fishing distributions, market constraints/fees, and Farm Bank fee with guide-section provenance. It intentionally does not add undocumented token payouts, costs, yields, or rankings. Verification: `bun run test` — 18 files / 83 tests passed; `bun run typecheck` — passed; `bun run build` — passed; `git diff --check` — passed for tracked changes and explicit untracked checks. Rollback boundary: `src/domain/guide/`, `src/adapters/guide/`, `docs/farming-season-guide.md`, and its focused test. Work-unit commit: pending.

## Next Step
- Implement FSP-2: local current-value input and strictly complete-only profitability calculations.
