import {
  getActivityFacts,
  getActivityEvidenceGaps,
  isCatalogFactUsable,
  type CatalogEvidenceGap,
  type CatalogFact,
  type EconomyActivity,
  type FactSource,
} from './EconomyCatalog';

export type EconomyCalculatorInput = Readonly<{
  activity: EconomyActivity;
  valueMultiplier: CatalogFact;
  sellerFeeRate: CatalogFact;
  applicableTownHallCapacities?: ReadonlyArray<CatalogFact>;
  additionalEvidenceGaps?: ReadonlyArray<CatalogEvidenceGap>;
}>;

export type EconomyMetrics = Readonly<{
  inputOpportunityCost: number;
  directCost: number;
  totalCost: number;
  grossValue: number;
  feeAmount: number;
  netPerCycle: number;
  netPerHour: number | undefined;
  netPerEnergy: number | undefined;
  breakEvenOutputUnitPrice: number | undefined;
  capacityCaps: ReadonlyArray<CatalogFact>;
  applicableTownHallCapacities: ReadonlyArray<CatalogFact>;
}>;

export type EconomyFormulaInputs = Readonly<{
  activity: EconomyActivity;
  valueMultiplier: CatalogFact;
  sellerFeeRate: CatalogFact;
  applicableTownHallCapacities: ReadonlyArray<CatalogFact>;
}>;

export type EconomyCalculation =
  | Readonly<{
    state: 'complete';
    missingFacts: ReadonlyArray<never>;
    metrics: EconomyMetrics;
    formulaInputs: EconomyFormulaInputs;
    provenance: ReadonlyArray<FactSource>;
  }>
  | Readonly<{
    state: 'incomplete';
    missingFacts: ReadonlyArray<CatalogEvidenceGap>;
  }>;

function factEvidenceGap(fact: CatalogFact): CatalogEvidenceGap {
  return Object.freeze({ factId: fact.id, factLabel: fact.label, source: fact.source });
}

function distinctGaps(gaps: ReadonlyArray<CatalogEvidenceGap>): ReadonlyArray<CatalogEvidenceGap> {
  const seen = new Set<string>();
  return Object.freeze(gaps.filter((gap) => {
    if (seen.has(gap.factId)) {
      return false;
    }
    seen.add(gap.factId);
    return true;
  }));
}

function isValidFeeRate(fact: CatalogFact): boolean {
  return fact.unit === 'percent'
    && typeof fact.value === 'number'
    && isCatalogFactUsable(fact)
    && fact.value >= 0
    && fact.value <= 1;
}

function isValidValueMultiplier(fact: CatalogFact): boolean {
  return fact.unit === 'multiplier'
    && typeof fact.value === 'number'
    && isCatalogFactUsable(fact)
    && fact.value >= 0;
}

function isValidTownHallCapacity(fact: CatalogFact): boolean {
  return fact.unit === 'items'
    && typeof fact.value === 'number'
    && Number.isInteger(fact.value)
    && isCatalogFactUsable(fact)
    && fact.value >= 0;
}

function sum(values: ReadonlyArray<number>): number {
  return values.reduce((total, value) => total + value, 0);
}

function valueOf(fact: CatalogFact): number {
  if (typeof fact.value !== 'number') {
    throw new Error(`Expected usable numeric fact: ${fact.id}`);
  }
  return fact.value;
}

function collectProvenance(input: EconomyCalculatorInput): ReadonlyArray<FactSource> {
  const sources = [
    ...getActivityFacts(input.activity).map((fact) => fact.source),
    ...input.activity.constraints.map((constraint) => constraint.source),
    input.valueMultiplier.source,
    input.sellerFeeRate.source,
    ...(input.applicableTownHallCapacities ?? []).map((capacity) => capacity.source),
  ];
  const seen = new Set<string>();
  return Object.freeze(sources.filter((source) => {
    const key = `${source.kind}|${source.reference}|${source.observedAt}|${source.dateKind}|${source.confidence}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }));
}

/**
 * Calculates only from source-backed facts. Unknown, malformed, or out-of-range
 * inputs return named evidence gaps instead of an estimate or rankable result.
 */
export function calculateEconomy(input: EconomyCalculatorInput): EconomyCalculation {
  const activityGaps = getActivityEvidenceGaps(input.activity);
  const multiplierGaps = isValidValueMultiplier(input.valueMultiplier) ? [] : [factEvidenceGap(input.valueMultiplier)];
  const feeGaps = isValidFeeRate(input.sellerFeeRate) ? [] : [factEvidenceGap(input.sellerFeeRate)];
  const townHallCapacityGaps = (input.applicableTownHallCapacities ?? [])
    .filter((capacity) => !isValidTownHallCapacity(capacity))
    .map(factEvidenceGap);
  const gaps = distinctGaps([
    ...activityGaps,
    ...multiplierGaps,
    ...feeGaps,
    ...townHallCapacityGaps,
    ...(input.additionalEvidenceGaps ?? []),
  ]);

  if (gaps.length > 0) {
    return Object.freeze({ state: 'incomplete', missingFacts: gaps });
  }

  const inputOpportunityCost = sum(input.activity.inputs.map((item) => valueOf(item.quantity) * valueOf(item.unitCost)));
  const directCost = sum(input.activity.additionalEconomicFacts.map(valueOf));
  const totalCost = inputOpportunityCost + directCost;
  const outputQuantity = sum(input.activity.outputs.map((output) => valueOf(output.quantity)));
  const grossValue = sum(input.activity.outputs.map((output) => valueOf(output.quantity) * valueOf(output.sellValue) * valueOf(input.valueMultiplier)));
  const feeAmount = grossValue * valueOf(input.sellerFeeRate);
  const netPerCycle = grossValue - feeAmount - totalCost;
  const durationHours = valueOf(input.activity.durationHours);
  const energyCost = sum(input.activity.energyActions.map(valueOf));
  const retainedRevenueRatio = (1 - valueOf(input.sellerFeeRate)) * valueOf(input.valueMultiplier);
  const breakEvenOutputUnitPrice = outputQuantity === 0 || retainedRevenueRatio === 0
    ? undefined
    : totalCost / (outputQuantity * retainedRevenueRatio);

  return Object.freeze({
    state: 'complete',
    missingFacts: Object.freeze([]),
    metrics: Object.freeze({
      inputOpportunityCost,
      directCost,
      totalCost,
      grossValue,
      feeAmount,
      netPerCycle,
      netPerHour: durationHours === 0 ? undefined : netPerCycle / durationHours,
      netPerEnergy: energyCost === 0 ? undefined : netPerCycle / energyCost,
      breakEvenOutputUnitPrice,
      capacityCaps: Object.freeze([...input.activity.limits]),
      applicableTownHallCapacities: Object.freeze([...(input.applicableTownHallCapacities ?? [])]),
    }),
    formulaInputs: Object.freeze({
      activity: input.activity,
      valueMultiplier: input.valueMultiplier,
      sellerFeeRate: input.sellerFeeRate,
      applicableTownHallCapacities: Object.freeze([...(input.applicableTownHallCapacities ?? [])]),
    }),
    provenance: collectProvenance(input),
  });
}
