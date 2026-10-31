# Public Market Context Specification

## Purpose

Define resilient use of anonymous, read-only public data for optional RWA and chain context.

## Requirements

### Requirement: Read-Only Public Context Retrieval

The system MAY request verified anonymous public market and chain context and MUST NOT attach game-session credentials or request game mutations.

#### Scenario: Public context is retrieved

- GIVEN a configured public read-only source responds with a valid payload
- WHEN the system refreshes optional context
- THEN the system SHALL validate and normalize the response
- AND it SHALL record the source and retrieval timestamp.

#### Scenario: A source requests authentication

- GIVEN a configured source responds with an authentication challenge or requires a session credential
- WHEN the system requests context
- THEN the system MUST stop using that source for public context
- AND it MUST NOT prompt for, store, or replay a session credential.

### Requirement: Staleness and Degraded Operation

The system MUST identify stale, invalid, or unavailable public context and SHALL continue calculator-only analysis when possible.

#### Scenario: Public price context is unavailable

- GIVEN a public source times out, fails validation, or is unavailable
- WHEN an analysis does not require the source
- THEN the system SHALL preserve locally calculated results
- AND it SHALL visibly mark external context as unavailable.

#### Scenario: Public price context is stale

- GIVEN the latest valid context exceeds its configured freshness threshold
- WHEN it is used in a recommendation
- THEN the system MUST show its timestamp and stale status
- AND it SHALL avoid presenting it as current market data.

### Requirement: External Data Boundary

The system MUST treat public payloads as untrusted external input and MUST validate shape, value ranges, and timestamps before use.

#### Scenario: External payload fails validation

- GIVEN a public endpoint returns an unexpected or malformed payload
- WHEN validation runs
- THEN the system MUST discard the invalid fields
- AND it SHALL report a safe degraded state without exposing raw sensitive diagnostics.
