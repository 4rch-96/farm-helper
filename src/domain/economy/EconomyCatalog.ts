export type EconomyActivityCategory =
  | 'crop'
  | 'animal'
  | 'feed'
  | 'processing'
  | 'mine'
  | 'oil'
  | 'fishing'
  | (string & {});

export type FactSourceKind = 'official-guide' | 'captured-game-ui' | 'approved-community' | 'unknown';
export type FactConfidence = 'verified' | 'captured' | 'community' | 'unknown';
export type FactDateKind = 'observed' | 'catalog-review' | 'unknown';

export type FactSource = Readonly<{
  kind: FactSourceKind;
  reference: string;
  observedAt: string | 'unknown';
  dateKind: FactDateKind;
  confidence: FactConfidence;
}>;

export type CatalogFactUnit =
  | 'tokens'
  | 'items'
  | 'hours'
  | 'energy'
  | 'Town Hall level'
  | 'multiplier'
  | 'percent'
  | (string & {});

export type CatalogFact = Readonly<{
  id: string;
  label: string;
  value: number | 'unknown';
  unit: CatalogFactUnit;
  source: FactSource;
}>;

export type ActivityInput = Readonly<{
  item: string;
  quantity: CatalogFact;
  unitCost: CatalogFact;
}>;

export type ActivityOutput = Readonly<{
  item: string;
  quantity: CatalogFact;
  sellValue: CatalogFact;
}>;

export type ActivityConstraint = Readonly<{
  id: string;
  label: string;
  source: FactSource;
}>;

export type EconomyActivity = Readonly<{
  id: string;
  category: EconomyActivityCategory;
  label: string;
  unlockLevel: CatalogFact;
  inputs: ReadonlyArray<ActivityInput>;
  outputs: ReadonlyArray<ActivityOutput>;
  durationHours: CatalogFact;
  energyActions: ReadonlyArray<CatalogFact>;
  limits: ReadonlyArray<CatalogFact>;
  additionalEconomicFacts: ReadonlyArray<CatalogFact>;
  constraints: ReadonlyArray<ActivityConstraint>;
}>;

export type EconomyCatalog = Readonly<{
  version: string;
  reviewedAt: string;
  activities: ReadonlyArray<EconomyActivity>;
}>;

export type CatalogEvidenceGap = Readonly<{
  factId: string;
  factLabel: string;
  source: FactSource;
}>;

const EXPECTED_CONFIDENCE: Readonly<Record<Exclude<FactSourceKind, 'unknown'>, Exclude<FactConfidence, 'unknown'>>> = Object.freeze({
  'official-guide': 'verified',
  'captured-game-ui': 'captured',
  'approved-community': 'community',
});

export function isCatalogFactUsable(fact: CatalogFact): boolean {
  const { source } = fact;

  return typeof fact.value === 'number'
    && Number.isFinite(fact.value)
    && source.kind !== 'unknown'
    && source.confidence !== 'unknown'
    && source.confidence === EXPECTED_CONFIDENCE[source.kind]
    && source.reference.trim().length > 0
    && source.observedAt !== 'unknown'
    && source.dateKind !== 'unknown';
}

export function getActivityFacts(activity: EconomyActivity): ReadonlyArray<CatalogFact> {
  return Object.freeze([
    activity.unlockLevel,
    ...activity.inputs.flatMap((input) => [input.quantity, input.unitCost]),
    ...activity.outputs.flatMap((output) => [output.quantity, output.sellValue]),
    activity.durationHours,
    ...activity.energyActions,
    ...activity.limits,
    ...activity.additionalEconomicFacts,
  ]);
}

export function getActivityEvidenceGaps(activity: EconomyActivity): ReadonlyArray<CatalogEvidenceGap> {
  return Object.freeze(
    getActivityFacts(activity)
      .filter((fact) => !isCatalogFactUsable(fact))
      .map((fact) => Object.freeze({ factId: fact.id, factLabel: fact.label, source: fact.source })),
  );
}

export function hasCompleteActivityEconomics(activity: EconomyActivity): boolean {
  return getActivityEvidenceGaps(activity).length === 0;
}
