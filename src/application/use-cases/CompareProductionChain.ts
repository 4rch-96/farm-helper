import {
  compareProductionChain,
  type ProductionChain,
  type ProductionChainComparison,
} from '../../domain/economy/ProductionChain';
import type { CatalogEvidenceGap, CatalogFact } from '../../domain/economy/EconomyCatalog';
import {
  evaluateTownHallActivityEligibility,
  getTownHallValueMultiplier,
  validateTownHallLevel,
  type TownHallLevel,
  type TownHallRules,
} from '../../domain/economy/TownHallRules';

export type CompareProductionChainInput = Readonly<{
  chain: ProductionChain;
  selectedTownHallLevel: number;
  townHallRules: TownHallRules;
  sellerFeeRate: CatalogFact;
}>;

export type ProductionChainComparisonResult =
  | Readonly<{ state: 'available'; comparison: ProductionChainComparison; unavailableActivities: ReadonlyArray<never> }>
  | Readonly<{ state: 'unavailable'; requiredTownHallLevel: TownHallLevel; unavailableActivities: ReadonlyArray<string>; missingFacts: ReadonlyArray<never> }>;

/** Applies selected Town Hall policy without requiring a snapshot, market, or game connection. */
export function compareProductionChainAtTownHall(input: CompareProductionChainInput): ProductionChainComparisonResult {
  const level = validateTownHallLevel(input.selectedTownHallLevel);
  const eligibility = input.chain.steps.map((step) => ({ id: step.id, eligibility: evaluateTownHallActivityEligibility(level, step.unlockLevel) }));
  const locked = eligibility.find((candidate) => candidate.eligibility.state === 'locked');
  if (locked?.eligibility.state === 'locked') {
    return Object.freeze({
      state: 'unavailable',
      requiredTownHallLevel: locked.eligibility.requiredLevel,
      unavailableActivities: Object.freeze(eligibility.filter((candidate) => candidate.eligibility.state === 'locked').map((candidate) => candidate.id)),
      missingFacts: Object.freeze([]),
    });
  }
  const multiplier = getTownHallValueMultiplier(input.townHallRules, level);
  const evidenceGaps: CatalogEvidenceGap[] = [
    ...(multiplier.ok ? [] : multiplier.missingFacts),
    ...eligibility.flatMap((candidate) => candidate.eligibility.state === 'incomplete' ? candidate.eligibility.missingFacts : []),
  ];
  const comparison = compareProductionChain({
    chain: input.chain,
    valueMultiplier: multiplier.ok ? multiplier.fact : input.townHallRules.levels[level - 1].valueMultiplier,
    sellerFeeRate: input.sellerFeeRate,
    additionalEvidenceGaps: evidenceGaps,
  });
  return Object.freeze({ state: 'available', comparison, unavailableActivities: Object.freeze([]) });
}
