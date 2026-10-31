# Economy Profitability Matrix Specification

## Purpose
Present a comparable, source-aware table of operating costs and returns for eligible catalog activities.

## Requirements

### Requirement: Comparable Economics
The system MUST calculate and display known direct cost, input opportunity cost, energy, time, fees, net profit per cycle, net profit per hour, net profit per energy, and break-even price for each eligible complete activity.

#### Scenario: Complete activity comparison
- GIVEN a selected Town Hall and an activity with all required verified inputs
- WHEN the matrix is calculated
- THEN the system SHALL show every comparable metric and its formula inputs.

#### Scenario: Incomplete activity comparison
- GIVEN an activity with one or more unknown required inputs
- WHEN the matrix is calculated
- THEN the system MUST not give it a definitive rank
- AND it SHALL show the missing inputs and source status.

### Requirement: Constraints and Limits
The matrix MUST disclose applicable energy actions, daily earning-cap treatment, production cadence, and activity-specific operational constraints.

#### Scenario: Capped farming activity
- GIVEN a farming or fishing activity subject to a known daily earning cap
- WHEN the matrix displays its result
- THEN the system SHALL state how the cap affects the estimate.

#### Scenario: Mine or oil activity
- GIVEN an activity is outside the farming daily cap
- WHEN the matrix displays its result
- THEN the system SHALL distinguish that treatment from capped activities.

### Requirement: Transparent Ranking
The system MUST let the player rank complete activities by a declared metric and MUST keep incomplete activities out of a definitive ranking.

#### Scenario: Rank by net per hour
- GIVEN multiple complete eligible activities
- WHEN the player chooses net profit per hour
- THEN the system SHALL sort by that metric and label the ranking criterion.

#### Scenario: No definitive comparable data
- GIVEN fewer than two complete eligible activities exist
- WHEN the matrix is rendered
- THEN the system SHALL explain that no definitive profitability ranking is available.
