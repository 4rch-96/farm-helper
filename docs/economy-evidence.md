# Economy evidence policy

Farm Helper calculates a decision only when its inputs are traceable and unit-compatible. Missing evidence is a visible planning limit, never an estimate, default price, or implied reward.

## Decision rule

A fact used in a complete calculation needs all of the following:

1. a source kind and stable reference;
2. an observed or published date with its meaning; and
3. a confidence state and compatible unit.

The planner labels evidence and results as follows:

| Label | Meaning |
| --- | --- |
| **Official** | A published Farming Season guide fact with verified provenance. |
| **Observed** | A dated value projected from a player-provided safe local capture or a dated local observation. |
| **Derived** | A formula result computed only from official and observed compatible inputs. |
| **Unknown** | Evidence is absent, incompatible, or not admissible. The option cannot be ranked. |

## Admissible sources

| Source kind | Use | Confidence | Required context |
| --- | --- | --- | --- |
| `official-guide` | Static game mechanics explicitly published by Farming Season. | `verified` | URL, named guide section, and review date. |
| `captured-game-ui` | A narrow planning value extracted from a player-provided local capture. | `captured` | Observation date and action or screen context. |
| `approved-community` | A source accepted through the project review process. | `community` | Canonical reference, review record, and factual date. |
| `unknown` | No compatible source exists. | `unknown` | Explicit evidence-gap label only. |

A catalog-review date records the repository audit; it is not an observation of the game and cannot make an unknown fact calculable.

## Local-capture boundary

The importer parses only in memory and returns a minimal projection for planning. It rejects credential-shaped, wallet-shaped, and private URL/cURL-shaped input before returning a projection. It omits account names, IDs, seller names, free-form logs, and raw source JSON.

The projection uses `game-token` or `unknown` as its value unit. It intentionally does not claim that an observed game balance delta has a particular wallet-token ticker or reward-conversion basis.

A dated crop seed-cost observation is local evidence for that crop only. It must not be generalized to another crop, farm, Town Hall level, recipe, or date.

## Complete calculation gates

| Alternative | Required evidence before calculation and ranking |
| --- | --- |
| Crop | Observed direct-game payout, dated observed seed cost, compatible game-token units, official growth duration, and official plant/harvest energy. |
| Animal | Captured animal and building counts, observed product payout, observed feed cost, compatible game-token units, official cadence/feed, and official feeding/collection energy. |
| Processing recipe | Inputs and quantities, duration, energy, output payout, and compatible units. |
| Order | Requested inputs and quantities, duration, energy, reward, and compatible units. |

Public market asks remain excluded until their price unit is independently validated. A SEASON/USD quote is never a substitute for a game reward amount or reward-pool share.

## Adding evidence safely

1. Keep only the smallest durable reference or safe projection needed for planning.
2. Record the source kind, factual date, confidence, unit, and exact activity context.
3. Add a test that preserves provenance and proves missing or incompatible evidence remains unranked.
4. Keep every game action manual and do not add authenticated game polling.

When a source is removed, contradicted, stale, or unit-incompatible, revert the affected calculation to evidence-pending rather than retaining a recommendation.
