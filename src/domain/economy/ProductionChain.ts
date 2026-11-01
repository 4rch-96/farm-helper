import {
  getActivityEvidenceGaps,
  isCatalogFactUsable,
  type ActivityConstraint,
  type ActivityInput,
  type ActivityOutput,
  type CatalogEvidenceGap,
  type CatalogFact,
  type EconomyActivity,
  type FactConfidence,
  type FactSource,
} from './EconomyCatalog';

export type ProductionChainFeedingRequirement = Readonly<{
  feedItem: string;
  quantityPerMeal: CatalogFact;
  cadenceHours: CatalogFact;
  missedFeedingConsequence: ActivityConstraint;
}>;

export type ProductionChain = Readonly<{
  id: string;
  label: string;
  initialInputs: ReadonlyArray<ActivityInput>;
  steps: ReadonlyArray<EconomyActivity>;
  finalOutputs: ReadonlyArray<ActivityOutput>;
  feedingRequirement?: ProductionChainFeedingRequirement;
}>;

export type ProductionChainInput = Readonly<{
  chain: ProductionChain;
  valueMultiplier: CatalogFact;
  sellerFeeRate: CatalogFact;
  additionalEvidenceGaps?: ReadonlyArray<CatalogEvidenceGap>;
}>;

export type ProductionChainMetrics = Readonly<{
  inputOpportunityCost: number;
  directCost: number;
  totalCost: number;
  directSaleGrossValue: number;
  directSaleFeeAmount: number;
  directSaleNet: number;
  grossValue: number;
  feeAmount: number;
  transformedNet: number;
  netDifference: number;
  accumulatedTimeHours: number;
  accumulatedEnergy: number;
}>;

export type ProductionChainWarning = Readonly<{
  code: 'feed-cadence' | 'starvation-risk';
  message: string;
  feedItem: string;
  quantityPerMeal: number;
  cadenceHours: number;
}>;

export type ProductionChainComparison =
  | Readonly<{
    state: 'complete';
    missingFacts: ReadonlyArray<never>;
    metrics: ProductionChainMetrics;
    constraints: ReadonlyArray<ActivityConstraint>;
    warnings: ReadonlyArray<ProductionChainWarning>;
    provenance: ReadonlyArray<FactSource>;
    freshness: ReadonlyArray<FactSource['observedAt']>;
    confidence: ReadonlyArray<FactConfidence>;
  }>
  | Readonly<{
    state: 'incomplete';
    missingFacts: ReadonlyArray<CatalogEvidenceGap>;
  }>;

function gap(fact: CatalogFact): CatalogEvidenceGap {
  return Object.freeze({ factId: fact.id, factLabel: fact.label, source: fact.source });
}

function distinctGaps(gaps: ReadonlyArray<CatalogEvidenceGap>): ReadonlyArray<CatalogEvidenceGap> {
  const seen = new Set<string>();
  return Object.freeze(gaps.filter((candidate) => {
    if (seen.has(candidate.factId)) return false;
    seen.add(candidate.factId);
    return true;
  }));
}

function valueOf(fact: CatalogFact): number {
  if (typeof fact.value !== 'number') throw new Error(`Expected usable numeric fact: ${fact.id}`);
  return fact.value;
}

function validFeeRate(fact: CatalogFact): boolean {
  return fact.unit === 'percent' && isCatalogFactUsable(fact) && valueOf(fact) >= 0 && valueOf(fact) <= 1;
}

function validMultiplier(fact: CatalogFact): boolean {
  return fact.unit === 'multiplier' && isCatalogFactUsable(fact) && valueOf(fact) >= 0;
}

function feedingGaps(requirement: ProductionChainFeedingRequirement | undefined): ReadonlyArray<CatalogEvidenceGap> {
  if (requirement === undefined) return [];
  const consequenceFact: CatalogFact = {
    id: requirement.missedFeedingConsequence.id,
    label: requirement.missedFeedingConsequence.label,
    value: 0,
    unit: 'items',
    source: requirement.missedFeedingConsequence.source,
  };
  return [requirement.quantityPerMeal, requirement.cadenceHours, consequenceFact]
    .filter((fact) => !isCatalogFactUsable(fact))
    .map(gap);
}

/**
 * Validates material availability in order. A step may consume only declared
 * initial stock or output from a preceding step; final sale quantities must
 * likewise be present in the resulting inventory.
 */
function materialFlowGaps(chain: ProductionChain): ReadonlyArray<CatalogEvidenceGap> {
  const inventory = new Map<string, number>();
  for (const item of chain.initialInputs) {
    inventory.set(item.item, (inventory.get(item.item) ?? 0) + valueOf(item.quantity));
  }
  const gaps: CatalogEvidenceGap[] = [];
  for (const step of chain.steps) {
    for (const item of step.inputs) {
      const available = inventory.get(item.item) ?? 0;
      const required = valueOf(item.quantity);
      if (available < required) {
        gaps.push(gap(item.quantity));
      } else {
        inventory.set(item.item, available - required);
      }
    }
    for (const output of step.outputs) {
      inventory.set(output.item, (inventory.get(output.item) ?? 0) + valueOf(output.quantity));
    }
  }
  for (const output of chain.finalOutputs) {
    if ((inventory.get(output.item) ?? 0) < valueOf(output.quantity)) gaps.push(gap(output.quantity));
  }
  return distinctGaps(gaps);
}

function collectSources(input: ProductionChainInput): ReadonlyArray<FactSource> {
  const facts = [
    ...input.chain.initialInputs.flatMap((item) => [item.quantity, item.unitCost]),
    ...input.chain.steps.flatMap((step) => [
      step.unlockLevel,
      ...step.inputs.flatMap((item) => [item.quantity, item.unitCost]),
      ...step.outputs.flatMap((output) => [output.quantity, output.sellValue]),
      step.durationHours,
      ...step.energyActions,
      ...step.limits,
      ...step.additionalEconomicFacts,
    ]),
    ...input.chain.finalOutputs.flatMap((output) => [output.quantity, output.sellValue]),
    input.valueMultiplier,
    input.sellerFeeRate,
    ...(input.chain.feedingRequirement === undefined ? [] : [
      input.chain.feedingRequirement.quantityPerMeal,
      input.chain.feedingRequirement.cadenceHours,
    ]),
  ];
  const sources = [...facts.map((fact) => fact.source), ...input.chain.steps.flatMap((step) => step.constraints.map((constraint) => constraint.source))];
  if (input.chain.feedingRequirement !== undefined) sources.push(input.chain.feedingRequirement.missedFeedingConsequence.source);
  const seen = new Set<string>();
  return Object.freeze(sources.filter((source) => {
    const key = `${source.kind}|${source.reference}|${source.observedAt}|${source.dateKind}|${source.confidence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}

/**
 * Compares selling only the chain's initial inputs with selling its declared final
 * outputs. Intermediate outputs are deliberately not revenue or a second input
 * cost: every consumed unit is represented once by the initial-input baseline.
 */
export function compareProductionChain(input: ProductionChainInput): ProductionChainComparison {
  const { chain } = input;
  const initialInputGaps = chain.initialInputs
    .flatMap((item) => [item.quantity, item.unitCost])
    .filter((fact) => !isCatalogFactUsable(fact))
    .map(gap);
  const finalOutputGaps = chain.finalOutputs
    .flatMap((output) => [output.quantity, output.sellValue])
    .filter((fact) => !isCatalogFactUsable(fact))
    .map(gap);
  const gaps = distinctGaps([
    ...initialInputGaps,
    ...finalOutputGaps,
    ...chain.steps.flatMap(getActivityEvidenceGaps),
    ...(validMultiplier(input.valueMultiplier) ? [] : [gap(input.valueMultiplier)]),
    ...(validFeeRate(input.sellerFeeRate) ? [] : [gap(input.sellerFeeRate)]),
    ...feedingGaps(chain.feedingRequirement),
    ...(input.additionalEvidenceGaps ?? []),
  ]);
  if (chain.steps.length === 0) {
    return Object.freeze({ state: 'incomplete', missingFacts: distinctGaps([...gaps, Object.freeze({ factId: `${chain.id}.steps`, factLabel: 'Ordered transformation steps', source: input.sellerFeeRate.source })]) });
  }
  if (gaps.length > 0) return Object.freeze({ state: 'incomplete', missingFacts: gaps });

  const flowGaps = materialFlowGaps(chain);
  if (flowGaps.length > 0) return Object.freeze({ state: 'incomplete', missingFacts: flowGaps });

  const multiplier = valueOf(input.valueMultiplier);
  const feeRate = valueOf(input.sellerFeeRate);
  const inputOpportunityCost = chain.initialInputs.reduce((total, item) => total + valueOf(item.quantity) * valueOf(item.unitCost), 0);
  const directSaleGrossValue = inputOpportunityCost * multiplier;
  const directSaleFeeAmount = directSaleGrossValue * feeRate;
  const directSaleNet = directSaleGrossValue - directSaleFeeAmount;
  const directCost = chain.steps.reduce((total, step) => total + step.additionalEconomicFacts.reduce((stepTotal, fact) => stepTotal + valueOf(fact), 0), 0);
  const grossValue = chain.finalOutputs.reduce((total, output) => total + valueOf(output.quantity) * valueOf(output.sellValue) * multiplier, 0);
  const feeAmount = grossValue * feeRate;
  const transformedNet = grossValue - feeAmount - inputOpportunityCost - directCost;
  const sources = collectSources(input);
  const warnings = chain.feedingRequirement === undefined ? [] : [Object.freeze({
    code: 'feed-cadence' as const,
    message: `Feed ${chain.feedingRequirement.feedItem} every ${valueOf(chain.feedingRequirement.cadenceHours)} hours; ${chain.feedingRequirement.missedFeedingConsequence.label}.`,
    feedItem: chain.feedingRequirement.feedItem,
    quantityPerMeal: valueOf(chain.feedingRequirement.quantityPerMeal),
    cadenceHours: valueOf(chain.feedingRequirement.cadenceHours),
  }), Object.freeze({
    code: 'starvation-risk' as const,
    message: chain.feedingRequirement.missedFeedingConsequence.label,
    feedItem: chain.feedingRequirement.feedItem,
    quantityPerMeal: valueOf(chain.feedingRequirement.quantityPerMeal),
    cadenceHours: valueOf(chain.feedingRequirement.cadenceHours),
  })];

  return Object.freeze({
    state: 'complete',
    missingFacts: Object.freeze([]),
    metrics: Object.freeze({
      inputOpportunityCost,
      directCost,
      totalCost: inputOpportunityCost + directCost,
      directSaleGrossValue,
      directSaleFeeAmount,
      directSaleNet,
      grossValue,
      feeAmount,
      transformedNet,
      netDifference: transformedNet - directSaleNet,
      accumulatedTimeHours: chain.steps.reduce((total, step) => total + valueOf(step.durationHours), 0),
      accumulatedEnergy: chain.steps.reduce((total, step) => total + step.energyActions.reduce((energy, fact) => energy + valueOf(fact), 0), 0),
    }),
    constraints: Object.freeze(chain.steps.flatMap((step) => step.constraints)),
    warnings: Object.freeze(warnings),
    provenance: sources,
    freshness: Object.freeze(sources.map((source) => source.observedAt)),
    confidence: Object.freeze(sources.map((source) => source.confidence)),
  });
}
