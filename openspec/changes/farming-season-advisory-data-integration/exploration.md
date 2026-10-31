## Exploration: Farming Season advisory data integration

### Current State
The workspace is greenfield and has no implementation stack. The user wants a read-only advisory product: no gameplay automation, purchases, sales, farming actions, or custody of wallet secrets.

Anonymous probes on 2026-10-30 confirmed this API boundary:

| Endpoint | Anonymous result | Advisory value |
| --- | --- | --- |
| `GET /api/farm` | `401 {"error":"login"}` | Private farm snapshot, only after the game establishes a session. |
| `GET /api/farm/clans` | `200` | Public clan roster and aggregate data. |
| `GET /api/farm/chain` | `200` | Robinhood Chain id, SEASON contract, vault, RPC and explorer configuration. |
| `GET /api/farm/players` | `200` | Public player-count aggregate. |
| `GET /api/rwa` | `200` | Gold, silver, oil and T-bill price/feed timestamps and read metadata. |

The user-provided authenticated farm response has the `owner`, `farm`, `access`, `now`, and `price` roots. The `farm` state contains Town Hall level, tokens, fields, structures, animals, daily counters, goods, silo inventory, passive income, fishing, and full-rate credit. It is sufficient input for a personalized profitability/energy recommendation engine.

The supplied network trace shows that private calls carry `fs_session`; therefore this is session-authenticated game data, not a documented public wallet-address API. The trace also exposed a session credential, which must never be stored, copied, replayed, logged, or included in product design.

Sources: [Farming Season guide](https://farmingseason.io/docs), [Farming Season terms](https://farmingseason.io/terms.html), anonymous endpoint probes above.

### Affected Areas
- `openspec/config.yaml` — already defines the advisory-only and ports-and-adapters constraints.
- `openspec/changes/farming-season-advisory-data-integration/exploration.md` — records data-source findings for later proposal/design work.
- Future `FarmSnapshotProvider` adapter — isolates imported snapshots from any later authorized provider.
- Future profitability domain — calculates recommendation scenarios without performing game operations.

### Approaches
1. **Local snapshot import first** — users download/copy a farm snapshot and the browser parses it locally.
   - Pros: no credential handling; works with the observed private endpoint boundary; fastest compliant MVP; testable using sanitized fixtures.
   - Cons: manual refresh; snapshot format may change.
   - Effort: Low.

2. **Browser-session endpoint integration** — a browser extension or same-origin integration reads the game session data.
   - Pros: potentially fresh account data.
   - Cons: session-cookie security risk; likely cross-origin/CORS limitations; undocumented contract; requires written authorization from Farming Season; can be perceived as automation.
   - Effort: High.

3. **Official provider integration** — Farming Season supplies a documented, scoped, read-only API/OAuth-like authorization flow.
   - Pros: durable, consented, refreshable, and supportable.
   - Cons: blocked until the game operator provides it.
   - Effort: Medium after provider availability.

### Recommendation
Build a responsive web/PWA with **local snapshot import as the first private-data adapter**. Keep calculations browser-local and model the source as a `FarmSnapshotProvider` port. Use only anonymous public endpoints for optional market context (`/api/rwa`, `/api/farm/chain`, `/api/farm/players`, and `/api/farm/clans`) behind separate read-only adapters with timeout, cache, schema validation, and graceful degradation.

Do not connect a wallet in the MVP merely to obtain farm state: the verified API requires a game session, not just the public wallet address. Wallet connection may be added later only for voluntary on-chain read-only enrichment after a concrete user benefit is specified. This preserves web-first portability and avoids the false promise of automatic farm access.

### Risks
- The private `/api/farm` contract is undocumented and may change without notice.
- Replaying or proxying `fs_session` would create an unacceptable credential-security and Terms-of-Use risk.
- Public responses should be treated as external, mutable data; timestamps must be surfaced so stale prices are not presented as current.
- Profitability estimates need explicit assumptions for token price, market fees, daily caps, full-rate credit, feed costs, and player-market liquidity; they are not financial advice.
- Terms prohibit bots/scripts/automation; every product capability must remain read-only and advisory.

### Ready for Proposal
Yes — for a web-first, snapshot-import MVP plus optional public market context. A proposal should explicitly exclude authenticated endpoint replay, game actions, cookie storage, and wallet custody.
