# Economy Profitability Matrix

## Objective
Make the product an extensible Farming Season data-analysis tool: a global cost-versus-profit matrix that compares every eligible activity by Town Hall level, with personal farm and market data as optional overlays.

## Problem and Why
The existing MVP only analyzes three illustrative scenarios. It does not answer the core player question: which crop, animal, production chain, mine/oil activity, or fishing activity has the best net profit after energy, feed, fees, time, caps, and opportunity cost.

## Authorized Scope
- A verified economy catalog for crops, animals, processing, mining, oil, and fishing.
- A comparable profitability table and production-chain analysis.
- Town Hall constraints, energy, feed, fees, daily caps, and risk disclosures.
- Optional farm/market snapshot overlays; future official integration remains deferred.

## Constraints
- Values MUST be traceable to an official source, captured game UI data, or an explicit user-provided dataset; never invent economics.
- Keep the app advisory-only with no game mutations, credential handling, or automatic authenticated polling.
- Preserve hexagonal architecture and make catalog/data sources replaceable.
- Engram mirror: pending because runtime identity is unavailable.

## Delivery Plan
The source of detailed implementation tasks is
`openspec/changes/economy-profitability-matrix/tasks.md`. The forecast is
1,100–1,500 authored lines, so delivery uses the previously accepted
feature-branch chain strategy with five reviewable work units. No remote
branch, pull request, or push is created until separately authorized.

- [x] EPM-1 — Collect admissible source evidence and establish the canonical, source-tagged economy catalog. Route: delegated; mapping trigger: existing calculator, profitability policy, adapter boundary, test setup, and local evidence must be reconciled; writer trigger: domain contract, catalog adapter, fixture, tests, and evidence policy span multiple non-trivial files. Source evidence precedes all economic constants.
- [x] EPM-2 — Add Town Hall eligibility/capacity rules and the incomplete-aware profitability matrix. Route: delegated; writer trigger across domain, application, and tests.
  - [x] EPM-2.1a — Add data-driven Town Hall levels 1–5 with source-aware unlock, field/building/animal capacity, multiplier rules, and focused tests. Route: delegated; writer trigger: non-trivial domain module plus focused tests. TDD: disabled by `openspec/config.yaml`; runner: `bun run test -- --run src/domain/economy/TownHallRules.test.ts`. Rollback boundary: Town Hall domain module and test.
  - [x] EPM-2.1b — Add the pure, evidence-gap-aware calculator and focused tests. Route: delegated; writer trigger: non-trivial domain module plus focused tests. TDD: disabled by `openspec/config.yaml`; runner: `bun run test -- --run src/domain/economy/EconomyCalculator.test.ts`. Rollback boundary: calculator domain module and test.
  - [x] EPM-2.2 — Add the catalog port and global matrix builder with focused application tests; snapshot and public-market ports remain optional, unused overlays. Route: delegated; writer trigger: application port/use case and focused tests. TDD: disabled by `openspec/config.yaml`; runner: `bun run test -- --run src/application/use-cases/BuildEconomyMatrix`. Rollback boundary: economy catalog provider, matrix use case, and their tests.
- [ ] EPM-3 — Add production-chain comparison with opportunity-cost accounting and animal feeding warnings. Route: delegated; writer trigger across domain, application, and tests.
- [ ] EPM-4 — Replace the illustrative calculator view with the global Town Hall planner and source-aware matrix. Route: delegated; writer trigger across presentation files and tests.
- [ ] EPM-5 — Document the evidence policy and run applicable full verification. Route: delegated; verification/documentation work unit.

## Acceptance Criteria
- A player can compare every supported activity at a selected Town Hall level using net/cycle, net/hour, net/energy, break-even price, costs, fees, and constraints.
- Production chains can compare selling an input with converting it to feed, animal output, or processed output.
- Every displayed value exposes source, freshness, assumptions, and confidence.
- Snapshot and market imports improve the result but are not required to use the global table.

## Progress
- 2026-10-30: Current MVP assessed; it contains only feed, egg, and milk illustrative scenarios.
- 2026-10-31: Proposal, requirements, technical design, and independent implementation tasks were prepared under `openspec/changes/economy-profitability-matrix/`.
- 2026-10-31: EPM-1 started on `codex/economy-profitability-matrix-epm1` from `main` at `3b57532`. TDD is disabled by `openspec/config.yaml` (`strict_tdd: false`); use ordinary focused verification with `bun run test -- --run src/domain/economy src/adapters/catalog`.
- EPM-1 evidence finding: no local official guide, captured game UI, approved community dataset, or source reference supports any economic constant. The previous illustrative feed (2.2), egg (16), milk (63), and 5% fee values are not admissible catalog evidence and remain unknown.
- EPM-1 work unit 1: `6175399` (`feat(economy): add evidence-aware catalog contract`) adds the extensible domain contract, evidence-gap policy, and synthetic-only fixtures. Focused test: 2 files / 7 tests passed. `bun run typecheck` passed. Runtime harness: N/A — this is a pure static domain contract. Rollback boundary: `src/domain/economy/` and `src/test/fixtures/economyCatalog.ts`. Native assessment: medium, `under_budget` (226 authored lines) against `3b57532`; no review due yet.
- EPM-1 work unit 2: `6b003a1` (`feat(economy): add unknown Farming Season catalog`) adds immutable category placeholders and the evidence-admission policy. The aggregate 484-line slice received the acknowledged native review `review-3e001b484a3bf91d` and was approved. Its two advisory reliability findings are accepted as a separate, same-scope correction candidate: known facts must require a nonempty factual source date (never `catalog-review`), and unknown constraints must keep an activity incomplete.
- EPM-1 correction: `48413ba` (`fix(economy): validate catalog evidence gaps`) applies those findings without reopening the approved receipt. It requires valid observed/published ISO source dates for known facts and counts unknown constraints as named evidence gaps. Focused test: 2 files / 8 tests passed. `bun run typecheck` and `git diff --check` passed. Runtime harness: N/A — EPM-1 is a static catalog/domain contract with no runtime integration boundary. Rollback boundary: `docs/economy-evidence.md`, `src/domain/economy/`, `src/adapters/catalog/`, and `src/test/fixtures/economyCatalog.ts`. Native assessment: medium, `under_budget` (100 authored lines) against reviewed boundary `6b003a1`; no new review was due.
- EPM-1 complete: seven required activity categories are immutable evidence-pending placeholders; every economic value remains explicit `unknown` until an admissible source is recorded with source identity, factual date/freshness, and confidence. No game action, wallet, credential, session, or market automation was added.
- 2026-10-31: EPM-2 authorized on `codex/economy-profitability-matrix-epm1`. Existing feature delivery remains `auto-chain` / `feature-branch-chain`; EPM-2 is the next PR-2 matrix slice after the reviewed EPM-1 boundary `6b003a1`. Receipt-driven development is enabled globally. Engram mirror remains pending because runtime identity is unavailable.
- EPM-2.1a verified: Town Hall levels 1–5 reject invalid selections and preserve source-tagged unlock, capacity, and multiplier evidence; default Farming Season capacities and multipliers remain explicit unknowns. Focused test: 1 file / 13 tests passed. Runtime harness: N/A — pure framework-independent domain policy. Rollback boundary: `src/domain/economy/TownHallRules.ts` and its test.
- EPM-2.1a work unit: `30bc04e` (`feat(economy): add source-aware Town Hall rules`) was approved and acknowledged as native review `review-56bdcf3db9b7fd5d` against `6b003a1`. Advisory R3-001 identified fractional capacity admission; the same-scope correction also rejects wrong-unit unlock, multiplier, and capacity facts. Corrected focused test: 1 file / 16 tests passed; `bun run typecheck` and `git diff --check` passed.
- EPM-2.1a correction: `3ce447e` (`fix(economy): validate Town Hall fact dimensions`) was assessed medium and `under_budget` at 78 authored lines against reviewed boundary `30bc04e`; no review was due.
- EPM-2.1b verified: the calculator separates direct cost from input opportunity cost, uses total cost for net and break-even economics, validates fee/multiplier/capacity evidence, and returns named gaps instead of a rankable result. Focused test: 1 file / 6 tests passed; `bun run typecheck` and `git diff --check` passed. Runtime harness: N/A — pure framework-independent calculation policy. Rollback boundary: `src/domain/economy/EconomyCalculator.ts` and its test.
- EPM-2.1b work unit: `1d345c4` (`feat(economy): add incomplete-aware calculations`) together with preceding correction `3ce447e` formed a 404-line slice and was approved and acknowledged as native review `review-4717d5bb969bf076` against reviewed boundary `30bc04e`, with no findings.
- EPM-2.2 verified: `EconomyCatalogProvider` and `BuildEconomyMatrix` produce complete, incomplete, and locked rows; disclose unlocks, Town Hall capacities, formula inputs, provenance, and ranking availability; exclude incomplete or undefined-metric rows from definitive ranking; and require neither snapshot nor public-market data. Focused EPM-2 suite: 4 files / 31 tests passed. `bun run typecheck` and `git diff --check` passed. Runtime harness: deterministic synthetic Town Hall 1–5 matrix fixtures; no UI or external runtime boundary. Rollback boundary: `src/application/ports/EconomyCatalogProvider.ts`, `src/application/use-cases/BuildEconomyMatrix.ts`, and its test.
- EPM-2 complete: no Farming Season economic constant was added; unknown Town Hall capacities/multipliers and catalog facts remain incomplete with named source gaps. No snapshot, market, game action, wallet, credential, session, or authenticated polling dependency was introduced. Engram mirror remains pending because runtime identity is unavailable.
- Next: stop before EPM-3; production-chain and UI work remain intentionally untouched.
