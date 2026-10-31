# Tasks: Farm Profitability Calculator

## Review Workload Forecast

| Field | Value |
| --- | --- |
| Estimated changed lines | 850–1,150 (application, tests, PWA UI, and E2E) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: workspace and calculation core → PR 2: import and public context → PR 3: calculator UI and browser journey |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
| --- | --- | --- | --- | --- | --- |
| 1 | Establish the Vite TypeScript workspace and pure profitability core | PR 1 | `bun run test -- --run src/domain src/application` | `bun run build` | workspace, domain, application, and unit-test files |
| 2 | Add safe snapshot import and optional public-context adapters | PR 2 | `bun run test -- --run src/adapters` | mocked public-context refresh in a local test | adapters and fixture files |
| 3 | Deliver the calculator PWA UI and import-to-guidance journey | PR 3 | `bun run test -- --run src/presentation` | `bun run e2e` against the local PWA | presentation and E2E files |

## Phase 1: Workspace and Calculation Foundation

- [x] 1.1 Create `package.json`, `bun.lock`, TypeScript, Vite, PWA, Vitest, Testing Library, and Playwright configuration with `bun run test` as the workspace-wide test command.
- [x] 1.2 Create sanitized deterministic fixtures in `src/test/fixtures/` for supported farm snapshots, unsupported versions, malformed snapshots, and public-context payloads; fixtures MUST NOT contain session credentials or wallet-private material.
- [x] 1.3 Write unit tests for `src/domain/farm/FarmSnapshot.ts` covering supported normalized fields, level constraints, energy, daily caps, inventory, silo, animals, and unavailable inputs.
- [x] 1.4 Implement `src/domain/farm/FarmSnapshot.ts` value objects and normalized types so the tests in 1.3 pass.
- [x] 1.5 Write unit tests for `src/domain/profitability/ProfitabilityPolicy.ts` covering ROI, energy efficiency, payback, documented seller fee net value, missing inputs, and unavailable activities below the Town Hall unlock level.
- [x] 1.6 Implement pure profitability and market-baseline policies in `src/domain/profitability/ProfitabilityPolicy.ts`; include no network, React, browser-storage, or game-action dependency.
- [x] 1.7 Create `src/application/ports/FarmSnapshotProvider.ts`, `src/application/ports/PublicMarketContextProvider.ts`, and tests for the application contracts.
- [x] 1.8 Implement `src/application/use-cases/AnalyzeFarmProfitability.ts` and `src/application/use-cases/CreateMarketGuidance.ts` to rank eligible scenarios and return unavailable cases plus disclosures.
- [x] 1.9 Refactor the core modules after GREEN while preserving test coverage and ensuring every recommendation retains formula inputs, timeframe, fees, and non-guarantee limitations.

## Review Follow-ups: Calculation Reliability (must complete before Phase 2)

- [x] 1.10 Add regression tests and correct `src/domain/profitability/ProfitabilityPolicy.ts` so payback uses net profit rather than net value and is unavailable when net profit is zero or negative.
- [x] 1.11 Add regression tests and update `src/application/use-cases/AnalyzeFarmProfitability.ts` so daily earning capacity limits affected scenarios or explicitly discloses the limitation.
- [x] 1.12 Add regression tests and update `src/application/use-cases/AnalyzeFarmProfitability.ts` so ranking uses a declared comparable metric and timeframe.

## Phase 2: Safe Data Adapters

- [x] 2.1 Write adapter tests for `src/adapters/import/JsonFarmSnapshotImporter.ts`: valid browser-local JSON import, malformed JSON rejection, unsupported versions, missing analysis fields, and credential-shaped field exclusion from normalized output and diagnostics.
- [x] 2.2 Implement `src/adapters/import/JsonFarmSnapshotImporter.ts` with schema validation and normalization; it MUST NOT transmit, persist, log, or replay `fs_session`, cookies, private keys, seed phrases, or credential-shaped fields.
- [x] 2.3 Write adapter tests for `src/adapters/http/FarmingSeasonPublicContextClient.ts` covering valid anonymous payloads, timeout, authentication challenge, invalid payload, stale data, and calculator-only fallback.
- [x] 2.4 Implement `src/adapters/http/FarmingSeasonPublicContextClient.ts` as an optional, read-only client for verified anonymous RWA/chain context; it MUST attach no game-session credential and MUST disable authentication-requiring sources.
- [x] 2.5 Add adapter integration tests that pass imported snapshots and optional public context through both use cases, checking stale/unavailable disclosures and absence of live player-market liquidity claims.

## Review Follow-ups: Adapter Reliability (must complete before Phase 3)

- [x] 2.6 Add regression tests and update `src/adapters/http/FarmingSeasonPublicContextClient.ts` so `retrievedAt` records client retrieval time separately from any source timestamp used for staleness.
- [x] 2.7 Add regression tests and broaden `src/adapters/import/JsonFarmSnapshotImporter.ts` credential-shaped key detection to cover common variants such as `accessToken`, `sessionToken`, and `auth_token` without exposing their values.

## Phase 3: Responsive PWA and Guidance UI

- [ ] 3.1 Create `src/presentation/features/calculator/` with a local file/paste import interface, validation feedback, snapshot freshness display, and a clear advisory-only boundary.
- [ ] 3.2 Create ranking and result-detail components that render ROI, energy efficiency, payback, unavailable scenarios, source values, fees, assumptions, timestamps, and the non-guarantee disclaimer.
- [ ] 3.3 Create market-guidance components that provide baseline sell/hold guidance and explicitly state that live player-market listings and liquidity are unavailable until a permitted public source is verified.
- [ ] 3.4 Write React Testing Library tests for import failures, credential warning redaction, missing-input states, stale public context, fee disclosure, and the absence of game-action controls.
- [ ] 3.5 Configure PWA metadata and offline shell behavior without caching imported farm snapshots or authenticated game responses.
- [ ] 3.6 Write `e2e/calculator.spec.ts` for a sanitized snapshot import that reaches ranked recommendations and market guidance with disclosures.

## Phase 4: Verification and Documentation

- [ ] 4.1 Run the workspace test suite, type check, production build, and the browser journey; record any unavailable or skipped check honestly.
- [ ] 4.2 Add a concise README section explaining local-only snapshot handling, manual game actions, calculation limitations, public-context freshness, and how to clear local data.
- [ ] 4.3 Review the final UI and outbound HTTP paths to confirm no session credential, wallet secret, game mutation, or unverified live listing claim is present.
