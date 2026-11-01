import { describe, expect, it } from 'vitest';
import { compareProductionChainAtTownHall } from './CompareProductionChain';
import { createTownHallRules } from '../../domain/economy/TownHallRules';
import type { CatalogFact, EconomyActivity } from '../../domain/economy/EconomyCatalog';
import type { ProductionChain } from '../../domain/economy/ProductionChain';

const source = Object.freeze({ kind: 'official-guide' as const, reference: 'Synthetic fixture only; not Farming Season evidence.', observedAt: '2026-10-31', dateKind: 'published' as const, confidence: 'verified' as const });
const fact = (id: string, value: number, unit: CatalogFact['unit']): CatalogFact => Object.freeze({ id, label: id, value, unit, source });
const rules = createTownHallRules([1, 2, 3, 4, 5].map((level) => Object.freeze({ level: level as 1 | 2 | 3 | 4 | 5, capacities: [], valueMultiplier: fact(`multiplier.${level}`, 1, 'multiplier') })));
const grain = Object.freeze({ item: 'grain', quantity: fact('grain.quantity', 1, 'items'), unitCost: fact('grain.cost', 2, 'tokens') });
const feed = Object.freeze({ item: 'feed', quantity: fact('feed.quantity', 1, 'items'), sellValue: fact('feed.sell', 6, 'tokens') });
const step = (unlockLevel: number): EconomyActivity => Object.freeze({ id: 'mill', label: 'Mill', category: 'feed', unlockLevel: fact('mill.unlock', unlockLevel, 'Town Hall level'), inputs: [grain], outputs: [feed], durationHours: fact('mill.hours', 1, 'hours'), energyActions: [fact('mill.energy', 1, 'energy')], limits: [], additionalEconomicFacts: [], constraints: [] });
const chain = (unlockLevel: number): ProductionChain => Object.freeze({ id: 'grain-feed', label: 'Grain feed', initialInputs: [grain], steps: [step(unlockLevel)], finalOutputs: [feed] });

describe('compareProductionChainAtTownHall', () => {
  it('returns a framework-independent comparable result when every activity is available', () => {
    const result = compareProductionChainAtTownHall({ chain: chain(1), selectedTownHallLevel: 1, townHallRules: rules, sellerFeeRate: fact('fee', 0.1, 'percent') });
    expect(result.state).toBe('available');
    if (result.state === 'available') expect(result.comparison.state).toBe('complete');
  });

  it('does not evaluate Town Hall-locked activities and discloses their required level', () => {
    const result = compareProductionChainAtTownHall({ chain: chain(3), selectedTownHallLevel: 1, townHallRules: rules, sellerFeeRate: fact('fee', 0.1, 'percent') });
    expect(result).toEqual(expect.objectContaining({ state: 'unavailable', requiredTownHallLevel: 3, unavailableActivities: ['mill'] }));
  });
});
