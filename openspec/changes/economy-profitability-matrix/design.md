# Design: Economy Profitability Matrix

## Technical Approach

Replace the snapshot-gated illustrative scenarios with a global, catalog-driven economy planner in the existing React/Vite application. The planner receives a selected Town Hall level and a static, documentation-backed economy catalog through a port. It evaluates eligible activities and production chains entirely in the domain/application layers, then renders a source-aware comparison table. A farm snapshot and market data remain optional overlays; neither is a dependency of the global table.

The catalog is deliberately data-driven. Each fact carries provenance and confidence, and any missing required fact makes the relevant row incomplete rather than estimated. This meets the new `economy-catalog`, `town-hall-planning`, `economy-profitability-matrix`, and `production-chain-analysis` specifications while preserving the existing profitability-analysis and market-guidance boundaries.

## Architecture Decisions

### Decision: Preserve React/Vite for this change

**Choice**: Extend the current TypeScript React/Vite PWA.
**Alternatives considered**: Migrate now to Next.js; introduce a separate backend.
**Rationale**: The scoped product is a browser-local documentation-backed calculator. A framework migration does not improve calculation correctness, catalog provenance, or Town Hall comparisons. The domain and application modules remain framework-independent so a future Next.js or backend composition layer can reuse them without reimplementing economics.

### Decision: Use a source-tagged catalog port

**Choice**: Define catalog activities and facts in a static adapter behind `EconomyCatalogProvider`.
**Alternatives considered**: Hard-code values in React components; require a farm/market JSON import before calculations.
**Rationale**: The calculator must work globally without personal data and must clearly distinguish official, captured, community, and unknown values. A port keeps later documentation, snapshot, market, or official API sources replaceable.

### Decision: Make Town Hall a global planner input

**Choice**: Model Town Hall rules as catalog data and pass a selected level into planning use cases.
**Alternatives considered**: Derive level only from an imported snapshot; scatter conditional checks across the UI.
**Rationale**: Players need to explore all levels 1–5 without supplying personal data. Data-driven rules keep unlocks, capacities, and value multipliers auditable and testable.

### Decision: Treat uncertainty as a first-class result

**Choice**: Return complete, incomplete, and locked results with evidence gaps.
**Alternatives considered**: Fill missing constants with defaults; omit activities silently.
**Rationale**: The product informs decisions involving money. A plausible invented value is more harmful than an explicitly unavailable recommendation. Incomplete rows remain visible with their missing facts and provenance.

### Decision: Evaluate production chains through opportunity cost

**Choice**: Represent chains as consumption/transformation/output steps and compare the chain to selling the same initial inputs directly.
**Alternatives considered**: Compare output sale price alone; add all intermediate values as independent revenue.
**Rationale**: Feed, animals, and processing only make economic sense relative to what their consumed inputs could have earned. A step-based model prevents double-counting intermediate products.

### Decision: Keep market and snapshot overlays optional

**Choice**: Existing `FarmSnapshotProvider` and `PublicMarketContextProvider` remain optional input ports.
**Alternatives considered**: Requiring a snapshot for the table; adding authenticated market access.
**Rationale**: The global catalog is the core experience. Optional overlays can refine inventory, caps, and prices later without changing the economics model or handling credentials.

## Data Flow

```text
Documentation-backed catalog adapter
            │
            ▼
  EconomyCatalogProvider ──► SelectTownHallPlan
            │                         │
            │                         ├──► EvaluateActivityMatrix
            │                         │       ├── Cost / fee / energy model
            │                         │       └── complete, incomplete, locked rows
            │                         │
            │                         └──► CompareProductionChains
            │
Optional FarmSnapshotProvider ────────► overlay constraints (future)
Optional PublicMarketContextProvider ─► overlay prices (future)
            │
            ▼
 React planner UI: Town Hall selector → sortable matrix → activity/chain detail
```

## File Changes

| File | Action | Description |
| --- | --- | --- |
| `src/domain/economy/EconomyCatalog.ts` | Create | Activity, fact provenance, confidence, source, input/output, constraint, and chain types. |
| `src/domain/economy/TownHallRules.ts` | Create | Town Hall level validation, eligibility, capacity, and verified multiplier application. |
| `src/domain/economy/EconomyCalculator.ts` | Create | Pure cost, fee, energy, break-even, and incomplete-result calculations. |
| `src/domain/economy/ProductionChain.ts` | Create | Step-based opportunity-cost comparison policy. |
| `src/application/ports/EconomyCatalogProvider.ts` | Create | Replaceable source contract for the catalog. |
| `src/application/use-cases/BuildEconomyMatrix.ts` | Create | Assemble selected-level activity rows and declared rankings. |
| `src/application/use-cases/CompareProductionChain.ts` | Create | Compare direct sale with a complete transformation chain. |
| `src/adapters/catalog/FarmingSeasonDocumentationCatalog.ts` | Create | Static source-tagged catalog with only verified facts; unknowns remain explicit. |
| `src/adapters/catalog/FarmingSeasonDocumentationCatalog.test.ts` | Create | Verify source metadata and unknown-value behavior. |
| `src/presentation/features/calculator/CalculatorApp.tsx` | Modify | Replace snapshot-only flow with global Town Hall planner; retain optional import entry point for later overlay work. |
| `src/presentation/features/calculator/EconomyMatrix.tsx` | Create | Accessible sortable matrix for complete, incomplete, and locked activities. |
| `src/presentation/features/calculator/ActivityDetail.tsx` | Create | Formula, provenance, assumptions, constraints, and evidence-gap inspector. |
| `src/presentation/features/calculator/ProductionChainComparison.tsx` | Create | Direct sale versus transformation-chain comparison surface. |
| `src/presentation/features/calculator/calculator.css` | Modify | Extend the existing original pixel-art utility workspace for table density and responsive views. |
| `src/test/fixtures/economyCatalog.ts` | Create | Sanitized catalog fixtures with verified and unknown facts. |
| `README.md` | Modify | Explain catalog sources, uncertainty, Town Hall planning, and optional overlays. |

## Interfaces / Contracts

```ts
export type FactSource = Readonly<{
  kind: 'official-guide' | 'captured-game-ui' | 'approved-community' | 'unknown';
  reference?: string;
  observedAt?: string;
  confidence: 'verified' | 'captured' | 'community' | 'unknown';
}>;

export type CatalogFact = Readonly<{
  value?: number;
  unit: 'SEASON' | 'energy' | 'hours' | 'items' | 'multiplier' | 'percent';
  source: FactSource;
}>;

export type EconomyActivity = Readonly<{
  id: string;
  category: 'crop' | 'animal' | 'feed' | 'processing' | 'mine' | 'oil' | 'fishing';
  label: string;
  unlockLevel: 1 | 2 | 3 | 4 | 5;
  inputs: ReadonlyArray<{ item: string; quantity: CatalogFact }>;
  outputs: ReadonlyArray<{ item: string; quantity: CatalogFact; sellValue?: CatalogFact }>;
  durationHours: CatalogFact;
  energyActions: ReadonlyArray<CatalogFact>;
  constraints: ReadonlyArray<string>;
}>;

export interface EconomyCatalogProvider {
  getCatalog(): Readonly<{ version: string; activities: ReadonlyArray<EconomyActivity> }>;
}

export type MatrixRow = Readonly<{
  activityId: string;
  state: 'complete' | 'incomplete' | 'locked';
  missingFacts: ReadonlyArray<string>;
  netPerCycle?: number;
  netPerHour?: number;
  netPerEnergy?: number;
  breakEvenPrice?: number;
  provenance: ReadonlyArray<FactSource>;
}>;
```

The final implementation may refine field names, but it MUST preserve the contract principles: source-tagged values, selected-level eligibility, explicit incompleteness, and no hidden market/snapshot dependency.

## Testing Strategy

| Layer | What to Test | Approach |
| --- | --- | --- |
| Unit | Town Hall range, unlocks, capacities, multipliers, fee/cost/energy arithmetic, break-even price, incomplete facts | Vitest table-driven tests for levels 1–5 and representative activities. |
| Unit | Production-chain opportunity cost and prevention of intermediate double-counting | Deterministic feed-to-animal and direct-sale fixture tests. |
| Adapter | Source metadata, catalog coverage, and unknown constants | Static catalog fixture tests; assert unknowns never produce a definitive row. |
| Application | Matrix filtering/ranking and optional overlay absence | Test global planning without snapshot or market context, then with optional constraints. |
| UI | Level selector, locked/incomplete display, ranking label, formula/provenance detail | React Testing Library with accessible table and mobile summaries. |
| E2E | Select Town Hall and inspect a global activity result | Playwright journey when a local browser is available; otherwise record it as unavailable without downloading a browser. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is introduced.

## Migration / Rollout

No persisted-user-data migration is required. The static global planner becomes the default calculator surface. The existing JSON import remains an optional future overlay entry point until a later change either completes that overlay or removes it deliberately. Catalog entries are rolled out only when their required facts have provenance; incomplete entries remain visible but unranked.

## Open Questions

- [ ] Exact seed, animal, building, workshop, bait, recipe, and current in-game sell values are not fully published in the guide; obtain verified captured UI evidence before claiming a complete ranking.
- [ ] Decide which community-source review standard permits a non-official fact into the catalog.
- [ ] Define the later market-price overlay separately; live listings, candles, and token-price intelligence are intentionally excluded from this change.
