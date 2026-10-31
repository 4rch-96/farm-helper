# Economy Evidence Policy

The economy catalog is an advisory data source. It never triggers a Farming
Season action, connects a wallet, stores credentials, opens a game session, or
polls an authenticated endpoint.

## Admission rule

Every economic fact used in a calculation must include all of these fields:

- a source kind and a stable source reference;
- a date or freshness marker with its meaning; and
- a confidence state.

For a known fact, the source date must be a valid ISO calendar date and its
kind must be `observed` or `published`. A `catalog-review` date records only
the evidence audit and is valid exclusively for an `unknown` fact.

A missing cost, price, yield, duration, energy requirement, fee, multiplier,
Town Hall unlock, capacity, recipe, building, bait, or sell value is recorded
as `unknown`. It must not be estimated, backfilled from another activity, or
used to rank an activity as economically complete.

## Allowed source kinds

| Source kind | When it is admissible | Confidence | Required reference and date |
| --- | --- | --- | --- |
| `official-guide` | A stable official Farming Season guide explicitly states the fact. | `verified` | URL or document identifier, quoted location, and the document's observed or updated date. |
| `captured-game-ui` | A reproducible capture of the relevant game screen shows the fact. | `captured` | Capture identifier or stored artifact path, screen/context description, and capture date. |
| `approved-community` | A source has passed the project's community-source review before use. | `community` | Canonical post/dataset reference, review record, and the observed or published date. |
| `unknown` | No admissible source is available for the fact. | `unknown` | A reference that says no admissible evidence is recorded; the date is `unknown` or an explicitly labelled catalog-review date. |

A catalog-review date means only that the repository was checked for evidence
on that date. It is **not** an observation of the game, a claim that the game
value was current, or a substitute for source provenance.

## Current catalog state

At the initial review on 2026-10-31, this repository contains no admissible
local official guide, captured UI artifact, approved community dataset, or
source reference for Farming Season economic constants. The static catalog
therefore uses only unknown placeholders for crop, animal, feed, processing,
mine, oil, and fishing economics. Existing illustrative UI numbers are not
catalog evidence and must remain outside catalog calculations until supported
by an admitted source.

## Adding a fact

1. Store or reference the evidence in a durable, reviewable location.
2. Record its source kind, reference, factual date/freshness, and matching
   confidence state on the catalog fact.
3. State the unit and the exact activity context; do not generalize a fact to
   another item, Town Hall level, or recipe without evidence.
4. Add tests that prove the new fact retains its provenance and that missing
   related facts still produce evidence gaps.
5. Keep the calculator advisory-only: users perform any game action manually.

Community evidence stays unavailable until a reviewer records its approval.
When evidence is removed, contradicted, or stale, revert the affected fact to
`unknown` rather than retaining an unsupported economic recommendation.
