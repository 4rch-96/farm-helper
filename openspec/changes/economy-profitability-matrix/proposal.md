# Proposal: Economy Profitability Matrix

## Intent

Turn Farm Helper from a three-scenario prototype into a documentation-backed warehouse and economy calculator. Players must be able to select a Town Hall level and compare the real operating economics of supported Farming Season activities before manually acting in the game.

## Scope

### In Scope
- An extensible economy catalog for crops, animal husbandry, feed, processing recipes, mine, oil well, and fishing.
- A Town Hall 1–5 planner that applies unlocks, capacity limits, value multipliers, and level-specific availability.
- A comparison matrix with direct inputs, feed/opportunity cost, energy, time, applicable fees and limits, net profit per cycle/hour/energy, and break-even price.
- Production-chain comparison, including sell-input versus transform-input alternatives.
- Per-value provenance, freshness, assumptions, and confidence/unknown state.
- A static global calculator that works without a wallet, farm snapshot, or market JSON.

### Out of Scope
- Authenticated game sessions, wallet custody, private keys, or game actions.
- A live player-market integration, market history, candles, token-price intelligence, or trading signals.
- Mandatory farm or market snapshot import; these remain optional future overlays.
- Invented economic values. Unpublished constants remain explicitly unknown until verified.
- Framework migration; the existing React/Vite implementation remains the delivery target for this change.

## Capabilities

### New Capabilities
- `economy-catalog`: Versioned, source-tagged activity and production data with explicit unknown values.
- `town-hall-planning`: Selection and application of Town Hall unlocks, capacity, multipliers, and eligibility.
- `economy-profitability-matrix`: Comparable cost-versus-return calculations and table presentation for all catalog activities.
- `production-chain-analysis`: Comparison of direct sale and multi-step transformations using consistent opportunity-cost accounting.

### Modified Capabilities
- `profitability-analysis`: Replace illustrative fixed scenarios with catalog-driven, Town Hall-aware comparisons while retaining transparent formulas and daily-cap disclosures.
- `market-guidance`: Restrict baseline market guidance to an optional downstream price source; it MUST NOT be required for the global calculator.

## Approach

Model game facts as a replaceable catalog adapter rather than UI constants. The domain computes economics only from inputs with provenance; unknown cost, price, or timing data yields an incomplete result with an explanation instead of a fabricated ranking. The application layer assembles eligible activities for the selected Town Hall and evaluates both direct activity and production chains. The presentation layer renders a sortable comparison table and exposes every assumption.

Snapshot and market imports remain separate adapters that can later overlay current inventory, farm capacity, and market prices. They are not dependencies of the initial calculator.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `src/domain/` | Modified/New | Catalog entities, Town Hall policies, cost model, and chain economics. |
| `src/application/` | Modified/New | Catalog-driven comparison and planning use cases. |
| `src/presentation/` | Modified/New | Town Hall selector, matrix, source/unknown disclosures, and chain comparison. |
| `src/adapters/` | New/Modified | Static documentation-backed catalog adapter and future overlay boundaries. |
| `src/test/` | New/Modified | Verified fixtures and deterministic matrix/chain scenarios. |
| `openspec/specs/` | Modified/New | Canonical requirements after archive. |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Published guide omits an economic constant | High | Mark it unknown; exclude it from definitive ranking and record the evidence gap. |
| Game balancing changes values | High | Version catalog entries with source URL/date and display freshness. |
| Chained inputs are double-counted | Medium | Use an explicit opportunity-cost policy and unit tests for direct-sale versus transformation alternatives. |
| Players interpret estimates as guarantees | Medium | Show formulas, costs, fee assumptions, confidence, and non-guarantee language beside every result. |
| Town Hall availability is incorrectly modeled | Medium | Capture level rules as data with tests for levels 1–5. |

## Rollback Plan

The catalog and matrix are additive and do not affect game state. Revert the feature branch or disable individual catalog entries with uncertain data; preserve unsupported entries as visibly unavailable rather than estimating them.

## Dependencies

- Official Farming Season guide for verified rules.
- Verified in-game UI data or user-provided evidence for values omitted from the guide.
- A source-review policy for community references before they can contribute catalog constants.

## Success Criteria

- [ ] A player can select any Town Hall level from 1 through 5 and see only eligible activities by default.
- [ ] Every supported activity shows all known costs, outputs, time, energy, fees, net/cycle, net/hour, net/energy, and break-even price.
- [ ] An unknown input prevents a definitive recommendation and explains the missing source.
- [ ] A production chain can be compared fairly with selling its inputs directly.
- [ ] The calculator works without market or farm JSON data.
- [ ] No feature performs game actions or uses game-session credentials.
