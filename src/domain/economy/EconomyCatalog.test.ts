import { describe, expect, it } from 'vitest';
import {
  getActivityEvidenceGaps,
  hasCompleteActivityEconomics,
  isCatalogFactUsable,
  type CatalogFact,
  type EconomyActivity,
  type FactSource,
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

function verifiedFact(fact: CatalogFact): CatalogFact {
  return { ...fact, value: 1, source: syntheticVerifiedFixtureFact.source };
}

function numericActivityWithUnknownConstraint(): EconomyActivity {
  const activity = pendingActivity();

  return {
    ...activity,
    unlockLevel: verifiedFact(activity.unlockLevel),
    inputs: activity.inputs.map((input) => ({
      ...input,
      quantity: verifiedFact(input.quantity),
      unitCost: verifiedFact(input.unitCost),
    })),
    outputs: activity.outputs.map((output) => ({
      ...output,
      quantity: verifiedFact(output.quantity),
      sellValue: verifiedFact(output.sellValue),
    })),
    durationHours: verifiedFact(activity.durationHours),
    energyActions: activity.energyActions.map(verifiedFact),
    limits: activity.limits.map(verifiedFact),
  };
}

describe('EconomyCatalog evidence contract', () => {
  it('supports an extensible activity category without changing the catalog contract', () => {
    expect(pendingActivity().category).toBe('orchard');
  });

  it('accepts a synthetic known fact only when its value and provenance are complete', () => {
    expect(isCatalogFactUsable(syntheticVerifiedFixtureFact)).toBe(true);
    expect(isCatalogFactUsable({
      ...syntheticVerifiedFixtureFact,
      source: { ...syntheticVerifiedFixtureFact.source, dateKind: 'published' },
    })).toBe(true);
  });

  it('does not treat unknown, unproven, or factually undated values as usable economics', () => {
    const unprovenNumericFact = { ...unknownFixtureFact, id: 'fixture.unproven-price', label: 'Unproven price', value: 999 };
    const invalidSources: ReadonlyArray<FactSource> = [
      { ...syntheticVerifiedFixtureFact.source, observedAt: '' },
      { ...syntheticVerifiedFixtureFact.source, observedAt: 'not-a-date' },
      { ...syntheticVerifiedFixtureFact.source, observedAt: '2026-02-30' },
      { ...syntheticVerifiedFixtureFact.source, dateKind: 'catalog-review' },
      { ...syntheticVerifiedFixtureFact.source, observedAt: 'unknown', dateKind: 'unknown' },
    ];

    expect(isCatalogFactUsable(unknownFixtureFact)).toBe(false);
    expect(isCatalogFactUsable(unprovenNumericFact)).toBe(false);
    for (const source of invalidSources) {
      expect(isCatalogFactUsable({ ...syntheticVerifiedFixtureFact, source })).toBe(false);
    }
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
      'fixture.orchard.constraint',
    ]);
    expect(hasCompleteActivityEconomics(activity)).toBe(false);
  });

  it('keeps an activity incomplete when only an operational constraint lacks evidence', () => {
    const activity = numericActivityWithUnknownConstraint();

    expect(getActivityEvidenceGaps(activity)).toEqual([
      {
        factId: 'fixture.orchard.constraint',
        factLabel: 'Synthetic constraint',
        source: unknownFixtureFact.source,
      },
    ]);
    expect(hasCompleteActivityEconomics(activity)).toBe(false);
  });
});
