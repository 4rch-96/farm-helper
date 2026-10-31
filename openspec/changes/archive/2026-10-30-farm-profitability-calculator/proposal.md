# Proposal: Farm Profitability Calculator

## Intent

Players need a transparent way to compare productive actions in Farming Season before investing tokens or daily energy. The MVP will analyze a manually imported farm snapshot and public price context to recommend profitable scenarios without automating or controlling the game.

## Scope

### In Scope
- A responsive web/PWA advisory experience for manually importing a Farming Season farm JSON snapshot.
- A browser-local calculator for crop, animal, feed, and farm-investment profitability scenarios using explicit assumptions.
- Sell-price and hold/sell guidance that accounts for known market fees, baseline game value, and available public RWA price context.
- Recommendation explanations showing source data, timestamps, formulas, assumptions, and uncertainty.
- Read-only public-data adapters for optional RWA and chain context, with validation, caching, and graceful degradation.

### Out of Scope
- Storing, replaying, proxying, or logging `fs_session` or any game-session credential.
- Gameplay automation or game mutations, including planting, harvesting, feeding, purchasing, listing, buying, or selling.
- Wallet custody, private-key handling, or a wallet connection intended to retrieve private game data.
- A live player-market listings integration. Its endpoint and anonymous availability are unconfirmed.
- Financial advice, promised returns, or automated trade execution.

## Capabilities

### New Capabilities
- `farm-snapshot-import`: Validate and normalize a user-provided farm snapshot entirely in the browser.
- `profitability-analysis`: Calculate and rank transparent ROI, energy-efficiency, and payback scenarios for eligible farm activities.
- `market-guidance`: Produce advisory sell/hold guidance using explicit fees, baseline values, and optionally available public price context.
- `public-market-context`: Fetch, validate, timestamp, cache, and expose optional anonymous RWA and chain data.

### Modified Capabilities
None. No main specifications exist yet.

## Approach

Build web-first as a responsive PWA. Apply a hexagonal boundary: the profitability domain and application use cases consume normalized snapshot and market-context ports; browser JSON import and public HTTP clients are adapters. Keep private account data on-device. Every recommendation MUST surface its inputs and assumptions so a player can verify it before taking any manual action in the game.

The market adapter will not claim that public player listings are available until a dedicated endpoint and payload are independently confirmed. Initial sell guidance will therefore calculate a target range from baseline value and the documented seller fee rather than report fabricated live liquidity.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `openspec/changes/farm-profitability-calculator/specs/` | New | Behavioral requirements for import, profitability analysis, guidance, and public context. |
| Future web application workspace | New | Responsive PWA and browser-local presentation adapters. |
| Future domain/application modules | New | DDD model, calculation policies, and use cases. |
| Future test fixtures | New | Sanitized farm snapshots and deterministic economic scenarios. |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Undocumented snapshot schema changes | Medium | Versioned validation, clear import errors, and sanitized compatibility fixtures. |
| Profitability misleads because assumptions are hidden | Medium | Show formulas, fees, timestamps, caps, token-price assumptions, and uncertainty. |
| Public price data is stale or unavailable | Medium | Cache with timestamps and degrade to calculator-only guidance. |
| Market-listing data is not public | High | Keep live listing comparison deferred until its endpoint and permitted access are confirmed. |
| Session credentials leak into the product | Medium | No credential input or persistence; use local JSON snapshots only. |

## Rollback Plan

The MVP is isolated from the game and performs no remote mutations. Disable optional public-context adapters behind configuration or remove the PWA deployment; imported snapshots remain local and can be deleted by the user. No game account state needs restoration.

## Dependencies

- A selected web/PWA stack and workspace-wide test command before implementation.
- Documented calculation constants and formulas, verified against the game guide and sanitized user snapshots.
- Optional: future evidence that a player-market listings endpoint is public and permitted for advisory use.

## Success Criteria

- [ ] A player can import a valid sanitized farm snapshot without transmitting session credentials.
- [ ] The app ranks available scenarios by transparent profitability and energy-related metrics.
- [ ] Every recommendation states its inputs, fee assumptions, data freshness, and limitations.
- [ ] The app works when public RWA data is unavailable and clearly indicates degraded context.
- [ ] No capability performs or queues an action in Farming Season.
