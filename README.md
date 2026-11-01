# Farm Helper

Farm Helper is a browser-local, evidence-aware Farming Season planning tool. It helps a player compare crops, animals, processing, and orders **only** when the inputs are sourced, dated, and compatible. It never automates the game or turns missing data into a recommendation.

## Quick path

```bash
bun install
bun run dev
```

1. Choose an officially documented Town Hall level (1–5).
2. Inspect a category on the decision board. A complete option shows its result and evidence; every other option names what is still needed.
3. Optionally analyze a safe, player-provided local capture and record a dated observed seed cost to unlock only the calculations that evidence supports.

## Read the decision board

| State | Meaning | Ranking |
| --- | --- | --- |
| **Complete** | Official mechanics and compatible observed game-token values are present. | Eligible; ranked by benefit per energy among visible eligible alternatives. |
| **Evidence pending** | One or more values, units, recipes, or rewards are missing. | Never ranked or recommended. |
| **Locked** | The selected Town Hall does not meet a documented unlock. | Never ranked or recommended. |

For a complete crop or animal alternative, the board shows:

- **Net benefit** = observed gross value − observed direct cost
- **ROI** = net benefit ÷ direct cost
- **Benefit / energy** = net benefit ÷ energy used in the cycle
- **Benefit / hour** = net benefit ÷ cycle duration

Each detail view labels its inputs and result as **Official**, **Observed**, **Derived**, or **Unknown**, and shows the source reference, date, and confidence whenever a source exists.

## What the planner can and cannot compare

- **Crops:** require an observed direct-game payout and a dated observed seed cost, together with the official growth and energy mechanics.
- **Animals:** require an observed farm count, building count, product payout, and feed cost, together with official cadence, feed, and energy mechanics.
- **Animal storage and processing:** remain evidence-pending until the destination, recipe, duration, energy, and compatible payout are sourced.
- **Recipes:** bread, cheese, butter, jam, and other transformations remain evidence-pending until their inputs, quantities, duration, energy, and output payout are evidenced.
- **Orders:** remain evidence-pending until their requested inputs, time, energy, and reward are evidenced.

The official guide currently documents Town Hall levels 1–5. Farm Helper does not present Town Hall 6 or 7 as available.

## Local evidence and privacy

A local capture is optional. Its source JSON is processed in memory and cleared after every analysis attempt; the app retains only a narrow planning projection. It does not retain raw captures, account names, wallet data, cookies, sessions, credentials, private URLs/cURLs, or authentication tokens.

Credential-, wallet-, and private request-shaped input is rejected before a projection is created. Personal metadata that is not needed for a calculation is omitted from the projection.

Observed balance and cost values are represented as a neutral **game-token** unit. A capture format may contain a token ticker, but that does not authorize Farm Helper to predict a game payout conversion or a wallet-token amount.

## Market boundary

The optional public SEASON/USD panel is credential-free market context. It can value a **known** SEASON amount in USD, but it never determines how many in-game tokens an activity pays. The planner does not combine that quote with game rewards, reward-pool share, or undocumented prices.

## Sources and limits

- Official mechanics: [Farming Season player guide](https://farmingseason.io/docs), reviewed 2026-11-01.
- The guide supports Town Hall, energy, crop timing, animal cadence/feed, feed conversion, capacity, and documented market-fee mechanics.
- It does not publish current crop/animal prices or payouts, workshop recipes, recipe rewards, or individual order rewards. Those facts stay unavailable until compatible evidence is supplied.

Farm Helper is advisory only, not financial advice or a promise of game earnings. Confirm current in-game conditions before acting.

## Verification

```bash
bun run test
bun run typecheck
bun run build
git diff --check
```

The browser scenario is available through `bun run e2e`. It requires a locally installed Playwright browser; in an environment without that browser executable, Playwright reports the missing binary instead of running the scenario.
