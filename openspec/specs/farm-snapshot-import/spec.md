# Farm Snapshot Import Specification

## Purpose

Define safe browser-local import and normalization of a Farming Season farm snapshot for advisory calculations.

## Requirements

### Requirement: Local Snapshot Processing

The system MUST parse a user-selected farm snapshot in the browser and MUST NOT transmit the snapshot to an application server or external analytics service.

#### Scenario: Valid snapshot is imported

- GIVEN a JSON document with the required farm snapshot roots and supported version
- WHEN the player imports the document
- THEN the system SHALL normalize the supported fields for advisory calculations
- AND the source snapshot SHALL remain available only in the browser session or user-controlled local storage.

#### Scenario: Malformed snapshot is rejected

- GIVEN a document that is not valid JSON or lacks required farm state
- WHEN the player imports the document
- THEN the system MUST reject it with an actionable validation error
- AND the system MUST NOT produce recommendations from partial data.

### Requirement: Credential Exclusion

The system MUST NOT accept, display, persist, transmit, log, or replay `fs_session`, browser cookies, private keys, seed phrases, or other credentials.

#### Scenario: Snapshot contains a credential-shaped field

- GIVEN an imported document containing a session cookie or other credential-shaped field
- WHEN validation runs
- THEN the system MUST exclude that field from normalized data and diagnostics
- AND the player SHALL receive a warning to remove or revoke the credential.

### Requirement: Schema and Freshness Transparency

The system MUST expose the imported schema version and snapshot timestamp when available, and SHALL identify missing inputs that limit an analysis.

#### Scenario: Imported schema is unsupported

- GIVEN a valid JSON document with an unsupported or absent snapshot version
- WHEN the player imports it
- THEN the system MUST refuse normalization or mark the affected analysis unavailable
- AND it SHALL explain the compatibility limitation.
