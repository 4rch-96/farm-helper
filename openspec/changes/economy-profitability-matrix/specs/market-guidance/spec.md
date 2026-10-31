# Delta for Market Guidance

## MODIFIED Requirements

### Requirement: Advisory-Only Guidance
The system MUST provide optional market guidance without placing, editing, cancelling, buying, or selling a game-market listing. The global economy calculator MUST function when market guidance is absent.
(Previously: The system provided recommendations without placing, editing, cancelling, buying, or selling a game-market listing.)

#### Scenario: Sell guidance is generated
- GIVEN a supported item with an optional baseline value and relevant fee assumptions
- WHEN the player requests market guidance
- THEN the system SHALL produce an advisory target range or hold/sell rationale
- AND it MUST NOT invoke a Farming Season mutation endpoint.

#### Scenario: User attempts an action from guidance
- GIVEN a player views market guidance
- WHEN they choose to act in the game
- THEN the system SHALL direct them to make the decision manually in Farming Season
- AND it MUST NOT prefill or submit a listing.

### Requirement: Fee-Aware Recommendations
The system MUST calculate and disclose known seller fees and other material costs before presenting optional net-value guidance.
(Previously: The system calculated and disclosed known seller fees and other material costs before presenting net-value guidance.)

#### Scenario: Fee information is available
- GIVEN a baseline price and documented seller fee
- WHEN a net-sale estimate is calculated
- THEN the system SHALL display gross value, each fee assumption, and estimated net value.

#### Scenario: Fee information is unknown or stale
- GIVEN current fee data is absent, unverified, or stale
- WHEN market guidance is requested
- THEN the system MUST label the estimate as limited or unavailable
- AND it MUST NOT claim a precise net outcome.

### Requirement: Unconfirmed Live Listings
The system MUST treat live player-market price, depth, and liquidity as an optional downstream source until a permitted listing source has been independently verified; it MUST NOT require it for global profitability comparisons.
(Previously: The system did not represent live player-market price, depth, or liquidity as available until a permitted source was verified.)

#### Scenario: No verified listings source exists
- GIVEN no verified permitted player-listing source is available
- WHEN the player requests market comparison
- THEN the system SHALL use only baseline-value guidance when available
- AND it SHALL state that live listing data is unavailable.
