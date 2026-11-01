import { describe, expect, it } from 'vitest';
import type { EconomyCatalogProvider } from '../ports/EconomyCatalogProvider';
import { buildEconomyMatrix } from './BuildEconomyMatrix';
import type { CatalogFact, EconomyActivity } from '../../domain/economy/EconomyCatalog';
import { createTownHallRules, type TownHallRule } from '../../domain/economy/TownHallRules';
import { syntheticVerifiedFixtureSource, unknownFixtureFact } from '../../test/fixtures/economyCatalog';

function fact(id: string, label: string, value: number, unit: CatalogFact['unit'] = 'tokens'): CatalogFact {
  return { id, label, value, unit, source: syntheticVerifiedFixtureSource };
}

function activity(id: string, unlock: number, outputValue: number): EconomyActivity {
  return {
    id,
    category: 'crop',
    label: `Synthetic ${id}`,
    unlockLevel: fact(`${id}.unlock`, 'Town Hall unlock', unlock, 'Town Hall level'),
    inputs: [{ item: 'Input', quantity: fact(`${id}.input.quantity`, 'Input quantity', 1, 'items'), unitCost: fact(`${id}.input.cost`, 'Input cost', 1) }],
    outputs: [{ item: 'Output', quantity: fact(`${id}.output.quantity`, 'Output quantity', 1, 'items'), sellValue: fact(`${id}.output.value`, 'Output value', outputValue) }],
    durationHours: fact(`${id}.duration`, 'Duration', 1, 'hours'),
    energyActions: [fact(`${id}.energy`, 'Energy', 1, 'energy')],
    limits: [fact(`${id}.limit`, 'Capacity', 1, 'items')],
    additionalEconomicFacts: [],
    constraints: [],
  };
}

function townHallRules() {
  const levels: TownHallRule[] = [1, 2, 3, 4, 5].map((level) => ({
    level: level as 1 | 2 | 3 | 4 | 5,
    capacities: [{
      id: `town-hall.${level}.field-capacity`,
      label: 'Synthetic field capacity',
      value: fact(`town-hall.${level}.field-capacity`, 'Synthetic field capacity', level, 'items'),
    }],
    valueMultiplier: fact(`town-hall.${level}.multiplier`, 'Synthetic value multiplier', 1, 'multiplier'),
  }));
  return createTownHallRules(levels);
}

function provider(activities: ReadonlyArray<EconomyActivity>): EconomyCatalogProvider {
  return {
    getCatalog: () => ({ version: 'synthetic-test-catalog', reviewedAt: '2026-01-01', activities }),
  };
}

describe('BuildEconomyMatrix', () => {
  it('works without snapshot or market data and sorts only complete rows by the declared metric', () => {
    const incomplete = {
      ...activity('incomplete', 1, 20),
      outputs: [{ ...activity('incomplete', 1, 20).outputs[0], sellValue: { ...unknownFixtureFact, id: 'incomplete.output.value', label: 'Output value', unit: 'tokens' } }],
    };
    const result = buildEconomyMatrix({
      catalogProvider: provider([activity('lower-net', 1, 5), activity('higher-net', 1, 10), incomplete, activity('locked', 3, 100)]),
      townHallRules: townHallRules(),
      selectedTownHallLevel: 1,
      sellerFeeRate: fact('seller-fee', 'Seller fee', 0, 'percent'),
      sortMetric: 'net-per-hour',
    });

    expect(result.sortMetric).toBe('net-per-hour');
    expect(result.ranking).toEqual({ status: 'available', comparableActivityCount: 2 });
    expect(result.rows.map((row) => [row.activityId, row.state, row.rank])).toEqual([
      ['higher-net', 'complete', 1],
      ['lower-net', 'complete', 2],
      ['incomplete', 'incomplete', undefined],
      ['locked', 'locked', undefined],
    ]);
    expect(result.rows[2]).toMatchObject({
      missingFacts: [{ factId: 'incomplete.output.value', factLabel: 'Output value', source: unknownFixtureFact.source }],
    });
    expect(result.rows[3]).toMatchObject({ state: 'locked', requiredUnlockLevel: 3 });
    const completeRow = result.rows[0];
    if (completeRow.state !== 'complete') {
      throw new Error('Expected a complete synthetic matrix row.');
    }
    expect(completeRow.applicableTownHallCapacities).toEqual([{
      id: 'town-hall.1.field-capacity',
      label: 'Synthetic field capacity',
      value: 1,
      fact: fact('town-hall.1.field-capacity', 'Synthetic field capacity', 1, 'items'),
    }]);
    expect(completeRow.formulaInputs.valueMultiplier).toMatchObject({ source: syntheticVerifiedFixtureSource });
    expect(completeRow.provenance).toEqual([syntheticVerifiedFixtureSource]);
  });

  it('does not rank an otherwise complete activity when the selected Town Hall multiplier is unknown', () => {
    const knownRules = townHallRules();
    const unknownMultiplierRules = createTownHallRules(knownRules.levels.map((rule) => rule.level === 1
      ? { ...rule, valueMultiplier: { ...unknownFixtureFact, id: 'town-hall.1.multiplier', label: 'Town Hall multiplier', unit: 'multiplier' } }
      : rule,
    ));

    const result = buildEconomyMatrix({
      catalogProvider: provider([activity('only', 1, 5)]),
      townHallRules: unknownMultiplierRules,
      selectedTownHallLevel: 1,
      sellerFeeRate: fact('seller-fee', 'Seller fee', 0, 'percent'),
    });

    expect(result.rows).toMatchObject([{
      activityId: 'only',
      label: 'Synthetic only',
      state: 'incomplete',
      rank: undefined,
      missingFacts: [{
        factId: 'town-hall.1.multiplier',
        factLabel: 'Town Hall multiplier',
        source: unknownFixtureFact.source,
      }],
    }]);
    expect(result.ranking).toEqual({
      status: 'unavailable',
      comparableActivityCount: 0,
      reason: 'fewer-than-two-complete-eligible-activities',
    });
  });

  it('does not claim a ranking for one complete eligible activity', () => {
    const result = buildEconomyMatrix({
      catalogProvider: provider([activity('only', 1, 5)]),
      townHallRules: townHallRules(),
      selectedTownHallLevel: 1,
      sellerFeeRate: fact('seller-fee', 'Seller fee', 0, 'percent'),
    });

    expect(result.ranking).toEqual({
      status: 'unavailable',
      comparableActivityCount: 1,
      reason: 'fewer-than-two-complete-eligible-activities',
    });
    expect(result.rows).toMatchObject([{ activityId: 'only', state: 'complete', rank: undefined }]);
  });

  it('leaves rows with an undefined selected metric unranked and out of the comparable count', () => {
    const zeroDuration = {
      ...activity('zero-duration', 1, 50),
      durationHours: fact('zero-duration.duration', 'Duration', 0, 'hours'),
    };
    const result = buildEconomyMatrix({
      catalogProvider: provider([activity('lower-net', 1, 5), zeroDuration, activity('higher-net', 1, 10)]),
      townHallRules: townHallRules(),
      selectedTownHallLevel: 1,
      sellerFeeRate: fact('seller-fee', 'Seller fee', 0, 'percent'),
      sortMetric: 'net-per-hour',
    });

    expect(result.ranking).toEqual({ status: 'available', comparableActivityCount: 2 });
    expect(result.rows.map((row) => [row.activityId, row.rank])).toEqual([
      ['higher-net', 1],
      ['lower-net', 2],
      ['zero-duration', undefined],
    ]);
  });
});
