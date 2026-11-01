import { describe, expect, it } from 'vitest';
import { calculateEconomy } from './EconomyCalculator';
import type { CatalogFact, EconomyActivity } from './EconomyCatalog';
import { syntheticVerifiedFixtureSource, unknownFixtureFact } from '../../test/fixtures/economyCatalog';

function fact(id: string, label: string, value: number, unit: CatalogFact['unit'] = 'tokens'): CatalogFact {
  return { id, label, value, unit, source: syntheticVerifiedFixtureSource };
}

function completeActivity(): EconomyActivity {
  return {
    id: 'synthetic-egg',
    category: 'animal',
    label: 'Synthetic egg activity',
    unlockLevel: fact('egg.unlock', 'Town Hall unlock', 1, 'Town Hall level'),
    inputs: [{ item: 'Synthetic feed', quantity: fact('feed.quantity', 'Feed quantity', 2, 'items'), unitCost: fact('feed.cost', 'Feed opportunity cost', 5) }],
    outputs: [{ item: 'Synthetic egg', quantity: fact('egg.quantity', 'Egg quantity', 3, 'items'), sellValue: fact('egg.value', 'Egg sell value', 10) }],
    durationHours: fact('egg.duration', 'Duration', 2, 'hours'),
    energyActions: [fact('egg.energy', 'Energy actions', 4, 'energy')],
    limits: [fact('egg.cap', 'Daily capacity', 12, 'items')],
    additionalEconomicFacts: [fact('egg.additional-cost', 'Additional direct cost', 1)],
    constraints: [],
  };
}

describe('EconomyCalculator', () => {
  it('calculates input opportunity cost, fee-adjusted profit, hourly/energy rates, break-even price, and caps from complete evidence', () => {
    const result = calculateEconomy({
      activity: completeActivity(),
      valueMultiplier: fact('town-hall.multiplier', 'Town Hall multiplier', 1.5, 'multiplier'),
      sellerFeeRate: fact('market.fee', 'Seller fee rate', 0.1, 'percent'),
      applicableTownHallCapacities: [fact('town-hall.field-capacity', 'Town Hall field capacity', 20, 'items')],
    });

    expect(result).toMatchObject({
      state: 'complete',
      missingFacts: [],
      metrics: {
        inputOpportunityCost: 10,
        directCost: 1,
        totalCost: 11,
        grossValue: 45,
        feeAmount: 4.5,
        netPerCycle: 29.5,
        netPerHour: 14.75,
        netPerEnergy: 7.375,
        breakEvenOutputUnitPrice: expect.closeTo(11 / 4.05),
        capacityCaps: [{ id: 'egg.cap', label: 'Daily capacity', value: 12, source: syntheticVerifiedFixtureSource }],
        applicableTownHallCapacities: [{
          id: 'town-hall.field-capacity',
          label: 'Town Hall field capacity',
          value: 20,
          source: syntheticVerifiedFixtureSource,
        }],
      },
    });
    if (result.state !== 'complete') {
      throw new Error('Expected complete synthetic calculation.');
    }
    expect(result.formulaInputs).toMatchObject({
      valueMultiplier: { id: 'town-hall.multiplier', source: syntheticVerifiedFixtureSource },
      sellerFeeRate: { id: 'market.fee', source: syntheticVerifiedFixtureSource },
      applicableTownHallCapacities: [{ id: 'town-hall.field-capacity', source: syntheticVerifiedFixtureSource }],
    });
    expect(result.provenance).toEqual([syntheticVerifiedFixtureSource]);
  });

  it('returns named gaps rather than an estimate when an activity, multiplier, or fee lacks evidence', () => {
    const incompleteActivity = {
      ...completeActivity(),
      inputs: [{ ...completeActivity().inputs[0], unitCost: { ...unknownFixtureFact, id: 'feed.cost', label: 'Feed opportunity cost', unit: 'tokens' } }],
    };
    const result = calculateEconomy({
      activity: incompleteActivity,
      valueMultiplier: { ...unknownFixtureFact, id: 'town-hall.multiplier', label: 'Town Hall multiplier', unit: 'multiplier' },
      sellerFeeRate: { ...unknownFixtureFact, id: 'market.fee', label: 'Seller fee rate', unit: 'percent' },
    });

    expect(result).toEqual({
      state: 'incomplete',
      missingFacts: [
        { factId: 'feed.cost', factLabel: 'Feed opportunity cost', source: unknownFixtureFact.source },
        { factId: 'town-hall.multiplier', factLabel: 'Town Hall multiplier', source: unknownFixtureFact.source },
        { factId: 'market.fee', factLabel: 'Seller fee rate', source: unknownFixtureFact.source },
      ],
    });
  });

  it('refuses a complete calculation when a directly supplied Town Hall capacity lacks evidence', () => {
    const result = calculateEconomy({
      activity: completeActivity(),
      valueMultiplier: fact('town-hall.multiplier', 'Town Hall multiplier', 1, 'multiplier'),
      sellerFeeRate: fact('market.fee', 'Seller fee rate', 0, 'percent'),
      applicableTownHallCapacities: [{
        ...unknownFixtureFact,
        id: 'town-hall.field-capacity',
        label: 'Town Hall field capacity',
        unit: 'items',
      }],
    });

    expect(result).toEqual({
      state: 'incomplete',
      missingFacts: [{
        factId: 'town-hall.field-capacity',
        factLabel: 'Town Hall field capacity',
        source: unknownFixtureFact.source,
      }],
    });
  });

  it.each([
    ['multiplier', {
      valueMultiplier: fact('town-hall.multiplier', 'Town Hall multiplier', 1, 'tokens'),
      sellerFeeRate: fact('market.fee', 'Seller fee rate', 0, 'percent'),
      applicableTownHallCapacities: [],
    }, 'town-hall.multiplier', 'Town Hall multiplier'],
    ['fee rate', {
      valueMultiplier: fact('town-hall.multiplier', 'Town Hall multiplier', 1, 'multiplier'),
      sellerFeeRate: fact('market.fee', 'Seller fee rate', 0, 'tokens'),
      applicableTownHallCapacities: [],
    }, 'market.fee', 'Seller fee rate'],
    ['Town Hall capacity', {
      valueMultiplier: fact('town-hall.multiplier', 'Town Hall multiplier', 1, 'multiplier'),
      sellerFeeRate: fact('market.fee', 'Seller fee rate', 0, 'percent'),
      applicableTownHallCapacities: [fact('town-hall.capacity', 'Town Hall capacity', 2, 'hours')],
    }, 'town-hall.capacity', 'Town Hall capacity'],
  ])('rejects a source-backed %s with the wrong semantic unit', (_label, input, factId, factLabel) => {
    const result = calculateEconomy({ activity: completeActivity(), ...input });

    expect(result).toEqual({
      state: 'incomplete',
      missingFacts: [{ factId, factLabel, source: syntheticVerifiedFixtureSource }],
    });
  });
});
