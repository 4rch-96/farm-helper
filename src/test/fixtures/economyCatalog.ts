import type { CatalogFact, FactSource } from '../../domain/economy/EconomyCatalog';

/**
 * Synthetic provenance for domain tests only. It is not evidence of a Farming
 * Season value and must never be copied into the production catalog.
 */
export const syntheticVerifiedFixtureSource: FactSource = Object.freeze({
  kind: 'official-guide',
  reference: 'test://economy-catalog/synthetic-verified-fact',
  observedAt: '2026-01-01',
  dateKind: 'observed',
  confidence: 'verified',
});

/**
 * Synthetic unknown provenance for tests. It models the production catalog's
 * missing-evidence state without asserting a game observation.
 */
export const unknownFixtureSource: FactSource = Object.freeze({
  kind: 'unknown',
  reference: 'Test fixture: no admissible source recorded.',
  observedAt: 'unknown',
  dateKind: 'unknown',
  confidence: 'unknown',
});

export const syntheticVerifiedFixtureFact: CatalogFact = Object.freeze({
  id: 'fixture.verified.quantity',
  label: 'Synthetic fixture quantity',
  value: 1,
  unit: 'items',
  source: syntheticVerifiedFixtureSource,
});

export const unknownFixtureFact: CatalogFact = Object.freeze({
  id: 'fixture.unknown.quantity',
  label: 'Unknown fixture quantity',
  value: 'unknown',
  unit: 'items',
  source: unknownFixtureSource,
});
