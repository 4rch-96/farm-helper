# Economy Profitability Matrix

## Objective
Make the product an extensible Farming Season data-analysis tool: a global cost-versus-profit matrix that compares every eligible activity by Town Hall level, with personal farm and market data as optional overlays.

## Problem and Why
The existing MVP only analyzes three illustrative scenarios. It does not answer the core player question: which crop, animal, production chain, mine/oil activity, or fishing activity has the best net profit after energy, feed, fees, time, caps, and opportunity cost.

## Authorized Scope
- A verified economy catalog for crops, animals, processing, mining, oil, and fishing.
- A comparable profitability table and production-chain analysis.
- Town Hall constraints, energy, feed, fees, daily caps, and risk disclosures.
- Optional farm/market snapshot overlays; future official integration remains deferred.

## Constraints
- Values MUST be traceable to an official source, captured game UI data, or an explicit user-provided dataset; never invent economics.
- Keep the app advisory-only with no game mutations, credential handling, or automatic authenticated polling.
- Preserve hexagonal architecture and make catalog/data sources replaceable.
- Engram mirror: pending because runtime identity is unavailable.

## Delivery Plan
The source of detailed implementation tasks is
`openspec/changes/economy-profitability-matrix/tasks.md`. The forecast is
1,100–1,500 authored lines, so delivery uses the previously accepted
feature-branch chain strategy with five reviewable work units. No remote
branch, pull request, or push is created until separately authorized.

- [ ] EPM-1 — Collect admissible source evidence and establish the canonical, source-tagged economy catalog. Route: delegated; source evidence precedes all economic constants.
- [ ] EPM-2 — Add Town Hall eligibility/capacity rules and the incomplete-aware profitability matrix. Route: delegated; writer trigger across domain, application, and tests.
- [ ] EPM-3 — Add production-chain comparison with opportunity-cost accounting and animal feeding warnings. Route: delegated; writer trigger across domain, application, and tests.
- [ ] EPM-4 — Replace the illustrative calculator view with the global Town Hall planner and source-aware matrix. Route: delegated; writer trigger across presentation files and tests.
- [ ] EPM-5 — Document the evidence policy and run applicable full verification. Route: delegated; verification/documentation work unit.

## Acceptance Criteria
- A player can compare every supported activity at a selected Town Hall level using net/cycle, net/hour, net/energy, break-even price, costs, fees, and constraints.
- Production chains can compare selling an input with converting it to feed, animal output, or processed output.
- Every displayed value exposes source, freshness, assumptions, and confidence.
- Snapshot and market imports improve the result but are not required to use the global table.

## Progress
- 2026-10-30: Current MVP assessed; it contains only feed, egg, and milk illustrative scenarios.
- 2026-10-31: Proposal, requirements, technical design, and independent implementation tasks were prepared under `openspec/changes/economy-profitability-matrix/`.
- Next: EPM-1. Exact economic constants remain blocked on admissible evidence and must remain explicitly unknown until verified.
