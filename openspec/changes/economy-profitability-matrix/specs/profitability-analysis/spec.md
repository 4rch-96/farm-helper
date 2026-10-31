# Delta for Profitability Analysis

## MODIFIED Requirements

### Requirement: Scenario Evaluation
The system MUST evaluate catalog-driven crop, animal, feed, processing, mine, oil, fishing, and investment scenarios using selected Town Hall rules, source-tagged facts, and configured calculation assumptions.
(Previously: The system evaluated supported scenarios using only normalized snapshot data and configured assumptions.)

#### Scenario: Eligible scenarios are ranked
- GIVEN a selected Town Hall and complete source-tagged assumptions for supported activities
- WHEN the player requests profitability analysis
- THEN the system SHALL calculate comparable profitability, payback, and energy-efficiency metrics
- AND it SHALL rank complete eligible scenarios using a declared metric and timeframe.

#### Scenario: Required input is missing
- GIVEN a scenario lacks a required cost, output, duration, capacity, or source-verified value
- WHEN the system evaluates that scenario
- THEN the system MUST mark the result unavailable rather than inventing a value
- AND it SHALL identify the missing input.

### Requirement: Constraints and Limits
The system MUST account for applicable Town Hall rules, activity availability, capacity, energy, known daily earning limits, and source confidence when those inputs affect an estimate.
(Previously: The system accounted for applicable imported constraints.)

#### Scenario: Activity is unavailable at the selected level
- GIVEN a selected Town Hall below an activity's unlock level
- WHEN the system evaluates that activity
- THEN the system MUST exclude it from actionable recommendations
- AND it SHALL state the unlock constraint.

#### Scenario: Snapshot constraints are absent
- GIVEN no farm snapshot is provided
- WHEN the player uses the global calculator
- THEN the system SHALL evaluate catalog and selected Town Hall constraints
- AND it MUST NOT require personal farm data.

### Requirement: Explainable Estimates
Every calculated result MUST display source values, formula inputs, assumptions, timeframe, confidence, and material limitations; it MUST NOT present an estimate as financial advice or guaranteed return.
(Previously: Results displayed formula inputs, assumptions, timeframe, and material limitations.)

#### Scenario: Player opens result detail
- GIVEN a calculated scenario result
- WHEN the player views its detail
- THEN the system SHALL show the source values, fees, assumptions, confidence, and formula components used
- AND it SHALL show a non-guarantee disclaimer.
