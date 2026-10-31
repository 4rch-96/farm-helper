# Field Ledger

A browser-local, read-only profitability companion for Farming Season.

## Run locally

```bash
bun install
bun run dev
```

Paste or select an exported farm JSON snapshot, then review the illustrative profitability rankings and baseline market guidance.

## Data and safety

- Snapshots are parsed in the browser session. Field Ledger does not ask for or store wallet keys, seed phrases, cookies, or `fs_session` values.
- The app does not plant, harvest, feed, buy, sell, list, or otherwise act in Farming Season. All game actions remain manual.
- Optional public market context uses anonymous requests only and omits browser credentials. If it is unavailable or stale, the calculator remains usable and labels the limitation.
- Imported market listings are not live liquidity data. Baseline guidance includes assumptions and the documented seller fee; confirm a current listing in the game before acting.

## Limits

All calculations are illustrative estimates, not financial advice or a promise of returns. Review each scenario's inputs, fees, timestamps, daily-cap limitations, and assumptions before making a game decision.

## Checks

```bash
bun run test
bun run typecheck
bun run build
```

`bun run e2e` requires a locally installed Playwright browser. It is intentionally not downloaded by this project.
