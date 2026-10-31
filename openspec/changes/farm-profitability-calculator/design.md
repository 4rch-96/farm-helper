# Design: Farm Profitability Calculator

## Technical Approach

Create a responsive TypeScript React PWA using Vite. The browser is the only runtime for private farm data: it imports and normalizes a JSON snapshot locally, executes profitability use cases locally, and renders explainable recommendations. Anonymous Farming Season RWA and chain endpoints are optional read-only adapters; failure of these adapters leaves the calculator usable.

The codebase will use a feature-oriented hexagonal layout. Domain policies and application use cases have no React, browser, or HTTP dependency. UI and HTTP/import implementations remain adapters behind ports.

## Architecture Decisions

### Decision: Web-first PWA

**Choice**: Vite + React + TypeScript PWA.
**Alternatives considered**: native macOS app; mobile-native app; server-rendered web application.
**Rationale**: A PWA works on the user's Mac and phone from one codebase, supports browser-local data processing, and avoids adding a server merely to handle sensitive farm snapshots. Native packaging can be evaluated later without changing the domain/application layers.

### Decision: Browser-local private data

**Choice**: Import a farm JSON snapshot into browser memory, with optional user-controlled local persistence only for normalized non-credential state.
**Alternatives considered**: server-side import; relaying the game's authenticated API; storing `fs_session`.
**Rationale**: The observed farm endpoint requires a game session. Keeping snapshots local protects credentials, respects the advisory-only boundary, and avoids coupling the product to undocumented authenticated APIs.

### Decision: Hexagonal DDD modules

**Choice**: Pure domain entities, value objects, policies, and calculation services behind application ports.
**Alternatives considered**: UI-owned calculations; direct HTTP/state calls in React components.
**Rationale**: Profitability logic is the product's durable core. Isolating it enables deterministic testing, schema adaptation, later desktop/mobile delivery, and new authorized data providers without altering calculation rules.

### Decision: Transparent estimates over unverified live market claims

**Choice**: Use baseline item value, documented fees, imported inventory, and optional timestamped RWA context. Treat player-listing liquidity as unavailable until a permitted public source is verified.
**Alternatives considered**: infer market prices from public player counts; consume session-bound market endpoints.
**Rationale**: A market listing API has not been verified as public. Fabricated liquidity or hidden session replay would be misleading and unsafe.

### Decision: Test stack and runner

**Choice**: Vitest for domain/application unit tests, Testing Library for UI integration tests, and Playwright for a small import-to-recommendation browser journey.
**Alternatives considered**: browser-only tests; no workspace test runner.
**Rationale**: The pure calculation engine needs fast deterministic tests, while import validation and disclosure rendering need integration coverage. `npm run test` will become the workspace-wide command, enabling strict TDD after project bootstrap.

## Data Flow

```text
Farm JSON file
    |
    v
Browser import adapter --> snapshot validator/normalizer --> FarmSnapshotProvider port
                                                             |
Public RWA/chain HTTP adapter --> PublicMarketContext port --+--> AnalyzeFarmProfitability use case
                                                                         |
                                                                         v
                                                              ranked recommendations + disclosures
                                                                         |
                                                                         v
                                                                  React PWA UI
```

1. The user selects a JSON file or pastes JSON locally.
2. The import adapter rejects credentials and unsupported schema versions, then normalizes supported fields.
3. The application invokes profitability and market-guidance use cases with normalized data and explicit assumptions.
4. Optional public context is validated, timestamped, and merged only when fresh enough.
5. The UI presents rankings, formulas, limitations, stale status, and a manual-action-only boundary.

## File Changes

| File | Action | Description |
| --- | --- | --- |
| `package.json` | Create | Workspace scripts and dependencies. |
| `vite.config.ts` | Create | Vite/PWA configuration. |
| `src/domain/farm/FarmSnapshot.ts` | Create | Farm state types and value objects. |
| `src/domain/profitability/ProfitabilityPolicy.ts` | Create | Pure ROI, energy-efficiency, fee, and payback policies. |
| `src/application/ports/FarmSnapshotProvider.ts` | Create | Imported snapshot port. |
| `src/application/ports/PublicMarketContextProvider.ts` | Create | Anonymous public-context port. |
| `src/application/use-cases/AnalyzeFarmProfitability.ts` | Create | Orchestrates validated scenario analysis. |
| `src/application/use-cases/CreateMarketGuidance.ts` | Create | Produces fee-aware, non-executing guidance. |
| `src/adapters/import/JsonFarmSnapshotImporter.ts` | Create | Browser-local parsing, credential exclusion, validation, normalization. |
| `src/adapters/http/FarmingSeasonPublicContextClient.ts` | Create | Read-only public RWA/chain client with timeout and validation. |
| `src/presentation/features/calculator/` | Create | Import, assumptions, ranking, and recommendation-detail UI. |
| `src/test/fixtures/` | Create | Sanitized farm snapshots and public-context payloads. |
| `src/**/*.test.ts` | Create | Unit and adapter test suite. |
| `e2e/calculator.spec.ts` | Create | Browser journey for import and recommendations. |

## Interfaces / Contracts

```ts
export interface FarmSnapshotProvider {
  import(raw: string): ImportFarmSnapshotResult;
}

export interface PublicMarketContextProvider {
  getContext(signal?: AbortSignal): Promise<PublicMarketContextResult>;
}

export interface AnalyzeFarmProfitability {
  execute(input: ProfitabilityAnalysisInput): ProfitabilityAnalysis;
}

export type ProfitabilityAnalysis = {
  generatedAt: string;
  scenarios: ReadonlyArray<ScenarioRecommendation>;
  unavailableScenarios: ReadonlyArray<UnavailableScenario>;
  disclosures: ReadonlyArray<Disclosure>;
};
```

`FarmSnapshot` contains only calculation-relevant fields. It deliberately excludes cookies, sessions, private keys, seed phrases, and any raw credential-shaped value. `PublicMarketContext` includes source URL, retrieval time, freshness state, and validated optional prices.

## Testing Strategy

| Layer | What to Test | Approach |
| --- | --- | --- |
| Unit | ROI, net sale, payback, energy, level/capacity eligibility, missing inputs | Vitest with fixed fixtures and clock values |
| Unit | Credential exclusion and schema normalization | Vitest using malformed and credential-containing JSON fixtures |
| Integration | Public context timeout, invalid payload, stale payload, calculator-only fallback | Adapter tests with mocked `fetch` |
| Integration | Import flow, disclosures, unavailable states, no action controls | React Testing Library |
| E2E | Import sanitized snapshot, see ranked recommendations and fee disclosure | Playwright against the local PWA |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary exists in this change.

## Migration / Rollout

No migration required. The first release is a static PWA. Farm data is not uploaded. Optional browser-local persistence is versioned and can be cleared by the player; incompatible snapshots are rejected with an explanation.

## Open Questions

- [ ] Verify the game’s item costs, yields, durations, and game-value constants before enabling each scenario calculation.
- [ ] Verify a permitted public player-market listing source before adding live market-price or liquidity comparisons.
- [ ] Select the PWA deployment host after the calculator has a tested local build.
