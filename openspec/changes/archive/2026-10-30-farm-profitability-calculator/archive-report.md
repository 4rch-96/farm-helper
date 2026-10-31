# Archive Report: Farm Profitability Calculator

## Final State

The Farm Profitability Calculator implementation is complete on the feature-chain UI branch.

## Completed Work

- Browser-local farm snapshot import and normalization.
- Transparent profitability, payback, daily-cap, and comparable hourly-profit calculations.
- Credential exclusion and anonymous public-context handling.
- Responsive, accessible original pixel-art calculator workspace.
- Market guidance with explicit data-freshness and live-listing limitations.

## Verification

- `bun run test`: passed — 7 files, 27 tests.
- `bun run typecheck`: passed.
- `bun run build`: passed.
- `bun run e2e`: unavailable — Playwright Chromium is not installed locally and no browser download was authorized.

## Review History

- `review-cf37f71213471fb2` was acknowledged. Its payback, daily-cap, and ranking findings were corrected in `c3d2b26`.
- `review-6269c0943ee3f5ab` was acknowledged. Its provenance and credential-detection findings were corrected in `a67245a`.
- The final UI/verification range was assessed as medium risk and under budget; no further review was due.

## Commits

- `cbef738` feat(core): add profitability calculation foundation
- `c3d2b26` fix(core): correct profitability recommendations
- `d525a27` feat(adapters): add safe farm data import
- `a67245a` fix(adapters): preserve data provenance
- `d085cfd` feat(ui): add pixel profitability workspace
- `05c2eb1` docs: add field ledger usage guide

## Remaining Gap

Browser E2E execution remains pending until Playwright Chromium is available through an explicitly authorized installation.
