import { describe, expect, it } from 'vitest';
import {
  getActivityEvidenceGaps,
  hasCompleteActivityEconomics,
  isCatalogFactUsable,
  type EconomyActivity,
} from './EconomyCatalog';
import { syntheticVerifiedFixtureFact, unknownFixtureFact } from '../../test/fixtures/economyCatalog';

function pendingActivity(): EconomyActivity {
  const unknown = (id: string, label: string) => ({ ...unknownFixtureFact, id, label });

  return {
    id: 'fixture.orchard',
    category: 'orchard',
    label: 'Synthetic future category',
    unlockLevel: unknown('fixture.orchard.unlock-level', 'Town Hall unlock level'),
    inputs: [{ item: 'Synthetic input', quantity: unknown('fixture.orchard.input.quantity', 'Input quantity'), unitCost: unknown('fixture.orchard.input.cost', 'Input cost') }],
    outputs: [{ item: 'Synthetic output', quantity: unknown('fixture.orchard.output.quantity', 'Output quantity'), sellValue: unknown('fixture.orchard.output.sell-value', 'Output sell value') }],
    durationHours: unknown('fixture.orchard.duration', 'Duration'),
    energyActions: [unknown('fixture.orchard.energy', 'Energy')],
    limits: [unknown('fixture.orchard.limit', 'Applicable limit')],
    additionalEconomicFacts: [],
    constraints: [{ id: 'fixture.orchard.constraint', label: 'Synthetic constraint', source: unknownFixtureFact.source }],
  };
}

describe('EconomyCatalog evidence contract', () => {
  it('supports an extensible activity category without changing the catalog contract', () => {
    expect(pendingActivity().category).toBe('orchard');
  });

  it('accepts a synthetic known fact only when its value and provenance are complete', () => {
    expect(isCatalogFactUsable(syntheticVerifiedFixtureFact)).toBe(true);
  });

  it('does not treat unknown or unproven numeric values as usable economics', () => {
    const unprovenNumericFact = { ...unknownFixtureFact, id: 'fixture.unproven-price', label: 'Unproven price', value: 999 };

    expect(isCatalogFactUsable(unknownFixtureFact)).toBe(false);
    expect(isCatalogFactUsable(unprovenNumericFact)).toBe(false);
  });

  it('returns named evidence gaps and refuses a definitive result for incomplete activities', () => {
    const activity = pendingActivity();

    expect(getActivityEvidenceGaps(activity).map((gap) => gap.factId)).toEqual([
      'fixture.orchard.unlock-level',
      'fixture.orchard.input.quantity',
      'fixture.orchard.input.cost',
      'fixture.orchard.output.quantity',
      'fixture.orchard.output.sell-value',
      'fixture.orchard.duration',
      'fixture.orchard.energy',
      'fixture.orchard.limit',
    ]);
    expect(hasCompleteActivityEconomics(activity)).toBe(false);
  });
});
