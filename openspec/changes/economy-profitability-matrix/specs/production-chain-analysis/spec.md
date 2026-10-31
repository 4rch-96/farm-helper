# Production Chain Analysis Specification

## Purpose
Compare direct sale of an input with converting it through feed, animals, or processing recipes.

## Requirements

### Requirement: Chain Definition
The system MUST model each production chain as ordered input, transformation, and output steps with time, energy, and economic requirements.

#### Scenario: Feed-to-animal chain
- GIVEN verified inputs for grain, feed, and an animal product
- WHEN the chain is evaluated
- THEN the system SHALL include every input, transformation, meal requirement, energy action, and output.

#### Scenario: Missing chain step value
- GIVEN a required step has an unknown economic constant
- WHEN the chain is evaluated
- THEN the system MUST mark the chain incomplete and identify the step.

### Requirement: Opportunity-Cost Comparison
The system MUST compare a transformation chain against selling its same initial inputs directly using the same price source and fee assumptions.

#### Scenario: Transformation is more profitable
- GIVEN direct sale and a complete transformation chain are comparable
- WHEN the player compares them
- THEN the system SHALL show the net difference, additional time, and additional energy.

#### Scenario: Inputs are double-counted
- GIVEN a chain reuses an intermediate output as a later input
- WHEN the chain is calculated
- THEN the system MUST count the economic value once per consumed unit.

### Requirement: Operational Warnings
The system MUST disclose material operational risks such as feed cadence, animal starvation risk, build blocking, or capacity constraints when they apply.

#### Scenario: Animal feeding requirement
- GIVEN an animal chain requires recurring meals
- WHEN the chain is shown
- THEN the system SHALL show meal frequency, feed quantity, and the consequence of missed feeding as a risk warning.
