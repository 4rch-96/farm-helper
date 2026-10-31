# Town Hall Planning Specification

## Purpose
Apply Town Hall 1–5 unlocks, capacities, and value rules to global economy planning.

## Requirements

### Requirement: Town Hall Selection
The system MUST let a player select any Town Hall level from 1 through 5 without requiring a farm snapshot.

#### Scenario: Planner selects a level
- GIVEN the global economy planner is open
- WHEN the player selects Town Hall level 3
- THEN the system SHALL recalculate eligibility and level-dependent values for level 3.

#### Scenario: Invalid level is requested
- GIVEN a level outside 1 through 5
- WHEN the planner evaluates activities
- THEN the system MUST reject the selection and explain the supported range.

### Requirement: Eligibility and Capacity
The system MUST apply catalog-defined unlock levels, building limits, field limits, and animal capacities for the selected Town Hall.

#### Scenario: Locked activity
- GIVEN an activity unlocks at level 3 and level 2 is selected
- WHEN the matrix is rendered
- THEN the activity SHALL be hidden by default or visibly marked locked
- AND it SHALL state its unlock level.

#### Scenario: Eligible activity
- GIVEN an activity is unlocked at the selected level
- WHEN the matrix is rendered
- THEN the system SHALL include it with the applicable capacity constraints.

### Requirement: Level-Dependent Value Rules
The system MUST apply verified Town Hall value multipliers only when the catalog supplies them.

#### Scenario: Multiplier is verified
- GIVEN a selected level has a verified produce-value multiplier
- WHEN a relevant activity is calculated
- THEN the system SHALL apply the multiplier and disclose it.

#### Scenario: Multiplier is unknown
- GIVEN a level-dependent multiplier is not verified
- WHEN a relevant activity is calculated
- THEN the system MUST mark the result incomplete rather than assume a multiplier.
