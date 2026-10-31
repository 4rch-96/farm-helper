# Tasks: Economy Profitability Matrix

## Review Workload Forecast

| Field | Value |
| --- | --- |
| Estimated changed lines | 1,100–1,500 (catalog, domain, application, UI, tests, and documentation) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: evidence and catalog contract → PR 2: Town Hall and matrix domain → PR 3: production chains and application use cases → PR 4: planner UI → PR 5: integration, documentation, and verification |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
| --- | --- | --- | --- | --- | --- |
| 1 | Establish source evidence and a source-tagged catalog contract without publishing unverified economics | PR 1; base = feature/tracker branch | `bun run test -- --run src/domain/economy src/adapters/catalog` | Catalog fixture load in the app test harness | Catalog/evidence types, adapter, fixtures, and tests |
| 2 | Add Town Hall rules and complete/incomplete profitability matrix calculations | PR 2; base = PR 1 branch | `bun run test -- --run src/domain/economy src/application/use-cases/BuildEconomyMatrix` | Deterministic Town Hall 1–5 matrix fixture | Town Hall, matrix domain/application files, and tests |
| 3 | Compare direct sale and production chains without double-counting inputs | PR 3; base = PR 2 branch | `bun run test -- --run src/domain/economy/ProductionChain src/application/use-cases/CompareProductionChain` | Feed-to-animal fixture comparison | Chain policy/use case files and tests |
| 4 | Deliver the global Town Hall planner and source-aware matrix UI | PR 4; base = PR 3 branch | `bun run test -- --run src/presentation/features/calculator` | `bun run build`; local planner interaction | Calculator UI, styles, UI tests |
| 5 | Document evidence policy and complete integration verification | PR 5; base = PR 4 branch | `bun run test` | `bun run build`; `bun run e2e` when a local browser exists | README, E2E, and verification-only changes |

## Phase 1: Evidence and Catalog Foundation

- [ ] 1.1 Create `src/domain/economy/EconomyCatalog.ts` and tests defining activities, source-tagged facts, confidence states, explicit unknown values, and extensible categories.
- [ ] 1.2 Create `docs/economy-evidence.md` with the evidence admission policy: official guide, captured game UI, approved community source, and unknown; require source reference and observed date for every usable constant.
- [ ] 1.3 Build `src/adapters/catalog/FarmingSeasonDocumentationCatalog.ts` and `src/test/fixtures/economyCatalog.ts` using only documented rules; record every unpublished seed, animal, building, bait, workshop, recipe, and sell-value constant as unknown rather than estimating it.
- [ ] 1.4 Add `src/adapters/catalog/FarmingSeasonDocumentationCatalog.test.ts` covering provenance, unsupported/missing values, category coverage, and the rule that unknown constants cannot become definitive economics.
- [ ] 1.5 Run `bun run test -- --run src/domain/economy src/adapters/catalog` and record the catalog evidence gaps in the change evidence.

## Phase 2: Town Hall and Matrix Domain

- [ ] 2.1 Write tests for `src/domain/economy/TownHallRules.ts` covering levels 1–5, invalid levels, documented unlocks, field/building/animal capacity, and verified value multipliers.
- [ ] 2.2 Implement `src/domain/economy/TownHallRules.ts` as data-driven validation and eligibility/capacity logic; it MUST expose unknown multiplier gaps instead of applying a default.
- [ ] 2.3 Write tests for `src/domain/economy/EconomyCalculator.ts` covering direct costs, feed/input opportunity cost, energy, fees, net per cycle/hour/energy, break-even price, caps, and incomplete facts.
- [ ] 2.4 Implement `src/domain/economy/EconomyCalculator.ts` so incomplete data yields an incomplete result with named evidence gaps and no definitive rank.
- [ ] 2.5 Create `src/application/ports/EconomyCatalogProvider.ts`, then write tests for `src/application/use-cases/BuildEconomyMatrix.ts` covering level filtering, complete/incomplete/locked rows, declared sorting metric, and no-snapshot operation.
- [ ] 2.6 Implement `src/application/use-cases/BuildEconomyMatrix.ts` and retain the existing snapshot and market providers as optional overlays only.
- [ ] 2.7 Run focused domain/application tests and verify a Town Hall 1–5 fixture produces no invented values.

## Phase 3: Production-Chain Analysis

- [ ] 3.1 Write tests for `src/domain/economy/ProductionChain.ts` for direct grain sale versus feed transformation, feed-to-animal economics, intermediate-consumption accounting, missing values, and feed/starvation warnings.
- [ ] 3.2 Implement `src/domain/economy/ProductionChain.ts` with ordered steps, opportunity-cost accounting, time/energy accumulation, and explicit operational warnings.
- [ ] 3.3 Write tests for `src/application/use-cases/CompareProductionChain.ts` covering a complete comparable chain, an incomplete chain, and an unavailable Town Hall activity.
- [ ] 3.4 Implement `src/application/use-cases/CompareProductionChain.ts` to present net difference, additional time, energy, constraints, provenance, and confidence.
- [ ] 3.5 Run focused chain tests and confirm inputs are counted once per consumed unit.

## Phase 4: Global Planner UI

- [ ] 4.1 Refactor `src/presentation/features/calculator/CalculatorApp.tsx` so the default experience is a global Town Hall planner; keep snapshot import as an optional future overlay entry point.
- [ ] 4.2 Create `src/presentation/features/calculator/EconomyMatrix.tsx` and tests for the accessible Town Hall selector, metric sort control, complete/incomplete/locked rows, responsive table summaries, and no mandatory JSON import.
- [ ] 4.3 Create `src/presentation/features/calculator/ActivityDetail.tsx` and tests displaying formulas, source references, freshness, assumptions, confidence, limits, and evidence gaps.
- [ ] 4.4 Create `src/presentation/features/calculator/ProductionChainComparison.tsx` and tests comparing direct sale with a transformation chain while showing feed cadence and starvation warnings when applicable.
- [ ] 4.5 Update `src/presentation/features/calculator/calculator.css` with dense, accessible pixel-art planner styling, reduced-motion support, and a mobile table representation; do not reuse Farming Season assets or branding.
- [ ] 4.6 Run presentation tests and `bun run build`; record browser E2E as unavailable unless a local Playwright browser already exists.

## Phase 5: Verification and Documentation

- [ ] 5.1 Update `README.md` with catalog provenance, confidence states, Town Hall planning, known evidence gaps, optional overlays, and the non-guarantee disclaimer.
- [ ] 5.2 Add or update `e2e/economy-matrix.spec.ts` for selecting a Town Hall and inspecting a documented global activity; run it only if a browser is installed locally.
- [ ] 5.3 Run `bun run test`, `bun run typecheck`, and `bun run build`; record pass/fail and any unavailable browser check honestly.
- [ ] 5.4 Review outbound HTTP paths and UI controls to confirm the global calculator requires neither a credential, wallet, snapshot, nor live market data.
