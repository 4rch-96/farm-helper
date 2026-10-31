# Economy Catalog Specification

## Purpose
Define a source-tagged, extensible catalog of Farming Season activities and their economic facts.

## Requirements

### Requirement: Catalog Activity Coverage
The system MUST represent supported crops, animal husbandry, feed, processing recipes, mine, oil well, and fishing as catalog activities.

#### Scenario: Activity is available in the catalog
- GIVEN a supported Farming Season activity
- WHEN the catalog is loaded
- THEN the activity SHALL expose its category, output, inputs, duration, energy actions, Town Hall requirement, and applicable limits.

#### Scenario: New activity category is introduced
- GIVEN a future game activity not covered by an existing category
- WHEN a catalog maintainer adds it
- THEN the system MUST support it without changing unrelated activity definitions.

### Requirement: Source-Tagged Facts
Every economic fact used by the calculator MUST include a source identity, source date or freshness, and confidence state.

#### Scenario: Verified documented value
- GIVEN an activity fact published in an official guide
- WHEN the fact is displayed or calculated
- THEN the system SHALL show it as verified with its source reference.

#### Scenario: Community or captured value
- GIVEN a fact comes from a captured game UI or approved community source
- WHEN the fact is displayed or calculated
- THEN the system MUST identify that source and its confidence separately from official documentation.

### Requirement: Unknown Constants
The system MUST NOT invent an unpublished economic constant.

#### Scenario: Required value is unknown
- GIVEN an activity lacks a required price, cost, yield, or timing value
- WHEN the catalog is used for comparison
- THEN the activity MUST be marked incomplete
- AND the missing constant and evidence gap SHALL be shown.
