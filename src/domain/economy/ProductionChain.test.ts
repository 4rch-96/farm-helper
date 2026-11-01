import { describe, expect, it } from 'vitest';
import { compareProductionChain, type ProductionChain } from './ProductionChain';
import type { CatalogFact, EconomyActivity } from './EconomyCatalog';

const source = Object.freeze({ kind: 'official-guide' as const, reference: 'Synthetic fixture only; not Farming Season evidence.', observedAt: '2026-10-31', dateKind: 'published' as const, confidence: 'verified' as const });
const fact = (id: string, value: number | 'unknown', unit: CatalogFact['unit']): CatalogFact => Object.freeze({ id, label: id, value, unit, source });
const activity = (id: string, inputs: EconomyActivity['inputs'], outputs: EconomyActivity['outputs'], hours = 1, energy = 1, direct = 0): EconomyActivity => Object.freeze({
  id, label: id, category: 'processing', unlockLevel: fact(`${id}.unlock`, 1, 'Town Hall level'), inputs, outputs,
  durationHours: fact(`${id}.hours`, hours, 'hours'), energyActions: [fact(`${id}.energy`, energy, 'energy')], limits: [],
  additionalEconomicFacts: direct === 0 ? [] : [fact(`${id}.direct`, direct, 'tokens')], constraints: [],
});
const input = (item: string, quantity: number | 'unknown', cost: number | 'unknown') => Object.freeze({ item, quantity: fact(`${item}.quantity`, quantity, 'items'), unitCost: fact(`${item}.cost`, cost, 'tokens') });
const output = (item: string, quantity: number | 'unknown', value: number | 'unknown') => Object.freeze({ item, quantity: fact(`${item}.output`, quantity, 'items'), sellValue: fact(`${item}.sell`, value, 'tokens') });
const baseInput = (chain: ProductionChain) => ({ chain, valueMultiplier: fact('multiplier', 1, 'multiplier'), sellerFeeRate: fact('fee', 0.1, 'percent') });

describe('compareProductionChain', () => {
  it('compares direct grain sale to feed without treating feed as a second revenue source', () => {
    const grain = input('grain', 10, 2);
    const feed = output('feed', 5, 6);
    const result = compareProductionChain(baseInput({ id: 'grain-feed', label: 'Grain to feed', initialInputs: [grain], steps: [activity('mill', [grain], [feed], 2, 3, 1)], finalOutputs: [feed] }));
    expect(result.state).toBe('complete');
    if (result.state === 'complete') {
      expect(result.metrics).toMatchObject({ inputOpportunityCost: 20, directSaleNet: 18, grossValue: 30, feeAmount: 3, transformedNet: 6, netDifference: -12, accumulatedTimeHours: 2, accumulatedEnergy: 3 });
    }
  });

  it('supports feed-to-animal economics while counting the grain opportunity cost once', () => {
    const grain = input('grain', 10, 2);
    const feed = output('feed', 5, 6);
    const animal = output('egg', 4, 12);
    const result = compareProductionChain(baseInput({
      id: 'animal', label: 'Animal', initialInputs: [grain],
      steps: [activity('mill', [grain], [feed], 2, 3, 1), activity('hen', [input('feed', 5, 6)], [animal], 4, 2, 2)], finalOutputs: [animal],
      feedingRequirement: { feedItem: 'feed', quantityPerMeal: fact('meal', 5, 'items'), cadenceHours: fact('cadence', 8, 'hours'), missedFeedingConsequence: Object.freeze({ id: 'starvation', label: 'Animal may starve when meals are missed', source }) },
    }));
    expect(result.state).toBe('complete');
    if (result.state === 'complete') {
      expect(result.metrics).toMatchObject({ inputOpportunityCost: 20, directCost: 3, grossValue: 48, accumulatedTimeHours: 6, accumulatedEnergy: 5 });
      expect(result.metrics.transformedNet).toBeCloseTo(20.2);
      expect(result.warnings.map((warning) => warning.code)).toEqual(['feed-cadence', 'starvation-risk']);
      expect(result.warnings[0]).toMatchObject({ quantityPerMeal: 5, cadenceHours: 8 });
    }
  });

  it('does not double count an intermediate output consumed by the next ordered step', () => {
    const grain = input('grain', 10, 2);
    const feed = output('feed', 5, 6);
    const animal = output('egg', 4, 12);
    const result = compareProductionChain(baseInput({ id: 'once', label: 'Once', initialInputs: [grain], steps: [activity('mill', [grain], [feed]), activity('hen', [input('feed', 5, 6)], [animal])], finalOutputs: [animal] }));
    expect(result.state).toBe('complete');
    if (result.state === 'complete') {
      expect(result.metrics.inputOpportunityCost).toBe(20);
      expect(result.metrics.grossValue).toBe(48);
      expect(result.metrics.transformedNet).toBeCloseTo(23.2);
    }
  });

  it('returns named gaps rather than estimates for incomplete evidence', () => {
    const grain = input('grain', 10, 'unknown');
    const feed = output('feed', 5, 6);
    const result = compareProductionChain(baseInput({ id: 'incomplete', label: 'Incomplete', initialInputs: [grain], steps: [activity('mill', [grain], [feed])], finalOutputs: [feed] }));
    expect(result).toMatchObject({ state: 'incomplete' });
    if (result.state === 'incomplete') expect(result.missingFacts.map((gap) => gap.factId)).toContain('grain.cost');
  });

  it('returns named gaps when a step consumes undeclared material or a final sale exceeds inventory', () => {
    const grain = input('grain', 1, 2);
    const feed = output('feed', 1, 6);
    const animal = output('egg', 2, 12);
    const result = compareProductionChain(baseInput({
      id: 'invalid-flow', label: 'Invalid flow', initialInputs: [grain],
      steps: [activity('mill', [input('feed', 2, 6)], [feed])], finalOutputs: [animal],
    }));
    expect(result).toMatchObject({ state: 'incomplete' });
    if (result.state === 'incomplete') {
      expect(result.missingFacts.map((gap) => gap.factId)).toContain('feed.quantity');
      expect(result.missingFacts.map((gap) => gap.factId)).toContain('egg.output');
    }
  });

  it('exposes provenance, freshness, and confidence only from its source-backed facts', () => {
    const grain = input('grain', 1, 2);
    const feed = output('feed', 1, 6);
    const result = compareProductionChain(baseInput({ id: 'traceable', label: 'Traceable', initialInputs: [grain], steps: [activity('mill', [grain], [feed])], finalOutputs: [feed] }));
    expect(result.state).toBe('complete');
    if (result.state === 'complete') {
      expect(result.provenance).toEqual([source]);
      expect(result.freshness).toEqual(['2026-10-31']);
      expect(result.confidence).toEqual(['verified']);
    }
  });
});
