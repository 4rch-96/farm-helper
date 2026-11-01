# Field Ledger

A browser-local, advisory profitability companion for Farming Season. Its global Town Hall planner compares only what the current evidence-aware catalog can support; missing facts remain visible instead of becoming estimates or recommendations.

## Run locally

```bash
bun install
bun run dev
```

Open the app and select a Town Hall level from 1 through 5. The planner can be used without an account, an imported farm snapshot, or market data.

## Catalog provenance and confidence

The current catalog is `farming-season-documentation-catalog-2026-10-31`, reviewed on `2026-10-31`. It contains evidence-pending placeholders for crop, animal, feed, processing, mine, oil, and fishing activities; it does **not** claim verified Farming Season economic values.

Every catalog fact records its value (or `unknown`), unit, source kind, source reference, source date and date kind, and confidence. A numeric fact is eligible for a complete calculation only when it has an admissible source:

- `official-guide` with `verified` confidence and a published or observed date;
- `captured-game-ui` with `captured` confidence and an observed date; or
- `approved-community` with `community` confidence and a published or observed date.

An `unknown` source or confidence is an evidence gap, not a value. In particular, the current catalog has no admissible activity economics, Town Hall capacities or value multipliers, or seller-fee rate. The planner names these gaps and does not turn them into a profitability ranking.

## Town Hall planner

The global planner supports Town Hall levels 1–5 and lets you select the declared ranking metric. Each activity is shown as one of these states:

- **Complete:** every required fact has admissible evidence; only these activities can receive a rank.
- **Incomplete:** one or more facts lack admissible evidence; the detail view names the gaps and reports that the formula is unavailable.
- **Locked:** the selected Town Hall level does not meet a documented unlock requirement.

Rows are ordered by the selected metric, but incomplete and locked activities are never ranked. Select an activity to inspect its source evidence and planning limits. This behavior is intentional: absence of evidence must remain visible instead of being replaced with invented economics.

## Optional overlays

A local farm snapshot and public-market context are optional future overlays. They do not gate Town Hall planning and cannot supply undocumented prices, recipes, fees, or production facts. Any overlay must remain local, source-aware, and explicitly limited; it is not a live-market feed.

## Safety, privacy, and boundaries

- The planner does not require or use credentials, wallet keys, seed phrases, cookies, login sessions, or `fs_session` values.
- Field Ledger does not plant, harvest, feed, buy, sell, list, or otherwise act in Farming Season. All game actions remain manual.
- The global planner uses the local documentation catalog and does not make HTTP requests. A legacy public-context adapter, when used outside the planner, sends anonymous requests with browser credentials omitted and rejects authenticated sources.
- The app has no authenticated polling or live-market dependency. A missing optional overlay must never prevent planner use.

## No-guarantee disclaimer

Field Ledger is advisory only. It does not provide financial advice, game guarantees, verified returns, or a promise that an activity is profitable. Confirm current in-game facts and your own constraints before acting; every displayed result is limited by the evidence, freshness, assumptions, caps, and gaps shown by the planner.

## Checks

```bash
bun run test
bun run typecheck
bun run build
```

`bun run e2e` requires a locally installed Playwright browser. The project intentionally does not download one.
