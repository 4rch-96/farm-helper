# Profitability Analysis Specification

## Purpose

Define transparent, read-only calculations that compare farm activity scenarios using imported farm state and stated assumptions.

## Requirements

### Requirement: Scenario Evaluation

The system MUST evaluate supported crop, animal, feed, and investment scenarios using only normalized snapshot data and configured calculation assumptions.

#### Scenario: Eligible scenarios are ranked

- GIVEN a normalized farm snapshot and complete assumptions for supported activities
- WHEN the player requests profitability analysis
- THEN the system SHALL calculate comparable profitability, payback, and energy-efficiency metrics
- AND it SHALL rank eligible scenarios using a declared metric and timeframe.

#### Scenario: Required input is missing

- GIVEN a scenario lacks a required cost, output, duration, or capacity input
- WHEN the system evaluates that scenario
- THEN the system MUST mark the result unavailable rather than inventing a value
- AND it SHALL identify the missing input.

### Requirement: Constraints and Limits

The system MUST account for applicable imported constraints, including Town Hall level, activity availability, capacity, energy, and known daily earning limits when those inputs affect an estimate.

#### Scenario: Activity is unavailable at the current level

- GIVEN an imported farm level below an activity's unlock level
- WHEN the system evaluates that activity
- THEN the system MUST exclude it from actionable recommendations
- AND it SHALL state the unlock constraint.

### Requirement: Explainable Estimates

Every calculated result MUST display its formula inputs, assumptions, timeframe, and material limitations; it MUST NOT present an estimate as financial advice or guaranteed return.

#### Scenario: Player opens result detail

- GIVEN a calculated scenario result
- WHEN the player views its detail
- THEN the system SHALL show the source values, fees, assumptions, and formula components used
- AND it SHALL show a non-guarantee disclaimer.
