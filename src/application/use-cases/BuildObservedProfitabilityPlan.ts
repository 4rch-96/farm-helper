import type { FarmingSeasonGuide, AnimalGuide, CropGuide, EnergyActionGuide } from '../../domain/guide/FarmingSeasonGuide';
import type { FactSource } from '../../domain/economy/EconomyCatalog';
import { calculateProfitability } from '../../domain/profitability/ProfitabilityPolicy';
import type {
  LocalGameCapture,
  ObservedActionObservation,
  ObservedValue,
} from '../../domain/observations/LocalGameCapture';

export type ObservedProfitabilityMetrics = Readonly<{
  grossValue: number;
  directCost: number;
  feeAmount: number;
  netBenefit: number;
  roi: number | undefined;
  benefitPerHour: number | undefined;
  benefitPerEnergy: number | undefined;
  cycleHours: number;
  energyPerCycle: number;
}>;

export type PlannerEvidenceStatus = 'official' | 'observed' | 'unknown';

export type PlannerEvidence = Readonly<{
  id: string;
  label: string;
  status: PlannerEvidenceStatus;
  source?: FactSource;
}>;

type PlannerCategory = 'animal' | 'crop' | 'recipe';

export type ObservedProfitabilityRow =
  | Readonly<{
    activityId: string;
    label: string;
    category: PlannerCategory;
    state: 'complete';
    observedAt: string;
    evidence: ReadonlyArray<PlannerEvidence>;
    resultStatus: 'derived';
    metrics: ObservedProfitabilityMetrics;
    rank: number | undefined;
  }>
  | Readonly<{
    activityId: string;
    label: string;
    category: PlannerCategory;
    state: 'incomplete';
    missing: ReadonlyArray<string>;
    evidence: ReadonlyArray<PlannerEvidence>;
    rank: undefined;
  }>;

export type ObservedProfitabilityPlan = Readonly<{
  capturedAt: string;
  rows: ReadonlyArray<ObservedProfitabilityRow>;
  actionObservations: ReadonlyArray<ObservedActionPlanContext>;
  marketPriceUnitState: 'unavailable' | 'unit-validation-pending';
  feeContext: Readonly<{
    playerMarketSellerFeeRate: number;
    farmBankSellerFeeRate: number;
  }>;
  ranking: Readonly<{
    status: 'available' | 'unavailable';
    metric: 'benefit-per-energy';
    completeActivityCount: number;
  }>;
}>;

export type ObservedActionPlanContext = Readonly<{
  kind: ObservedActionObservation['kind'];
  scope: 'batch';
  item: string;
  quantity: number;
  observedAt: string;
  energyDelta: number;
  tokenDelta: number;
  siloDeltas: Readonly<Record<string, number>>;
  fieldDeltas: Readonly<Record<string, number>>;
  source: ObservedActionObservation['source'];
  documentedEnergy: number | undefined;
  observedEnergySpent: number | undefined;
  energyComparison: 'matches' | 'differs' | 'not-comparable';
}>;

const BUILDING_KIND_BY_ANIMAL: Readonly<Record<string, string>> = Object.freeze({
  chicken: 'coop',
  sheep: 'sheepPen',
  cow: 'barn',
  pig: 'pigPen',
});

const RECIPE_ITEMS = Object.freeze(['flour', 'bread', 'cheese', 'butter', 'jam', 'cloth', 'juice']);

/** Stable local-input key for a player-observed seed purchase; it is not a game price assumption. */
export function cropSeedCostKey(cropId: string): string {
  return `${cropId}-seed`;
}

function energyFor(guide: FarmingSeasonGuide, id: string): EnergyActionGuide | undefined {
  return guide.energyActions.find((action) => action.id === id);
}

function actionContext(
  guide: FarmingSeasonGuide,
  observation: ObservedActionObservation,
): ObservedActionPlanContext {
  const documentedRule = energyFor(guide, 'plant-or-harvest-field');
  const documentedEnergy = documentedRule === undefined
    ? undefined
    : documentedRule.energy.value * observation.quantity;
  const observedEnergySpent = observation.energyDelta <= 0
    ? -observation.energyDelta
    : undefined;
  const energyComparison = documentedEnergy === undefined || observedEnergySpent === undefined
    ? 'not-comparable'
    : documentedEnergy === observedEnergySpent ? 'matches' : 'differs';

  return Object.freeze({
    kind: observation.kind,
    scope: observation.scope,
    item: observation.item,
    quantity: observation.quantity,
    observedAt: observation.observedAt,
    energyDelta: observation.energyDelta,
    tokenDelta: observation.tokenDelta,
    siloDeltas: observation.siloDeltas,
    fieldDeltas: observation.fieldDeltas,
    source: observation.source,
    documentedEnergy,
    observedEnergySpent,
    energyComparison,
  });
}

function observedValueFor(values: Readonly<Record<string, ObservedValue>>, item: string): ObservedValue | undefined {
  return values[item.toLowerCase()];
}

function evidenceStatus(source: FactSource): PlannerEvidenceStatus {
  if (source.kind === 'official-guide') return 'official';
  if (source.kind === 'captured-game-ui') return 'observed';
  return 'unknown';
}

function sourcedEvidence(id: string, label: string, source: FactSource): PlannerEvidence {
  return Object.freeze({ id, label, status: evidenceStatus(source), source });
}

function unknownEvidence(id: string, label: string): PlannerEvidence {
  return Object.freeze({ id, label, status: 'unknown' });
}

function tokenUnitGap(values: ReadonlyArray<ObservedValue | undefined>): string | undefined {
  if (values.some((value) => value === undefined)) return undefined;
  return values.every((value) => value?.unit === 'game-token')
    ? undefined
    : 'compatible in-game token units';
}

function incomplete(
  activityId: string,
  label: string,
  category: PlannerCategory,
  missing: ReadonlyArray<string>,
  evidence: ReadonlyArray<PlannerEvidence> = [],
): ObservedProfitabilityRow {
  return Object.freeze({
    activityId,
    label,
    category,
    state: 'incomplete',
    missing: Object.freeze([...missing]),
    evidence: Object.freeze([
      ...evidence,
      ...missing.map((item) => unknownEvidence(`${activityId}.${item}`, item)),
    ]),
    rank: undefined,
  });
}

function metrics(
  grossValue: number,
  directCost: number,
  cycleHours: number,
  energyPerCycle: number,
): ObservedProfitabilityMetrics {
  const calculated = calculateProfitability({
    grossValue,
    directCost,
    durationHours: cycleHours,
    energyCost: energyPerCycle,
  });

  return Object.freeze({
    grossValue: calculated.grossValue,
    directCost: calculated.totalCost,
    feeAmount: calculated.feeAmount,
    netBenefit: calculated.netProfit,
    roi: calculated.roi,
    benefitPerHour: calculated.hourlyProfit,
    benefitPerEnergy: calculated.energyEfficiency,
    cycleHours,
    energyPerCycle,
  });
}

function animalRow(
  animal: AnimalGuide,
  guide: FarmingSeasonGuide,
  capture: LocalGameCapture,
): ObservedProfitabilityRow {
  const animalCount = capture.farm.animalCounts[animal.id] ?? 0;
  if (animalCount === 0) {
    return incomplete(animal.id, animal.label, 'animal', ['no animals in the captured farm']);
  }

  const buildingKind = BUILDING_KIND_BY_ANIMAL[animal.id];
  const buildingCount = buildingKind === undefined ? 0 : (capture.farm.buildingCounts[buildingKind] ?? 0);
  const payout = observedValueFor(capture.directPayouts, animal.product);
  const feedCost = observedValueFor(capture.directUnitCosts, 'feed');
  const feedingEnergy = energyFor(guide, 'feed-building');
  const collectionEnergy = energyFor(guide, 'collect-animal-products');
  const unitGap = tokenUnitGap([payout, feedCost]);
  const missing = [
    ...(buildingCount > 0 ? [] : ['captured building count']),
    ...(payout === undefined ? [`direct-game payout for ${animal.product.toLowerCase()}`] : []),
    ...(feedCost === undefined ? ['captured feed unit cost'] : []),
    ...(feedingEnergy === undefined ? ['official feeding energy rule'] : []),
    ...(collectionEnergy === undefined ? ['official collection energy rule'] : []),
    ...(unitGap === undefined ? [] : [unitGap]),
  ];
  if (missing.length > 0 || payout === undefined || feedCost === undefined
    || feedingEnergy === undefined || collectionEnergy === undefined) {
    return incomplete(animal.id, animal.label, 'animal', missing);
  }

  const cycleHours = animal.productCadenceHours.value;
  const mealCount = cycleHours / 12;
  const feedBags = animalCount * mealCount * animal.feedBagsPerMeal.value;
  const totalFeedCost = feedBags * feedCost.value;
  const grossValue = animalCount * payout.value;
  const feedEnergy = buildingCount * mealCount * feedingEnergy.energy.value;
  const productCollectionDays = cycleHours / 24;
  const productEnergy = buildingCount * productCollectionDays * collectionEnergy.energy.value;
  const energyPerCycle = feedEnergy + productEnergy;
  return Object.freeze({
    activityId: animal.id,
    label: animal.label,
    category: 'animal',
    state: 'complete',
    observedAt: payout.capturedAt,
    evidence: Object.freeze([
      sourcedEvidence(`${animal.id}.payout`, `${animal.product} payout`, payout.source),
      sourcedEvidence(`${animal.id}.feed-cost`, 'Feed unit cost', feedCost.source),
      sourcedEvidence(`${animal.id}.cadence`, 'Product cadence', animal.productCadenceHours.source),
      sourcedEvidence(`${animal.id}.feed`, 'Feed bags per meal', animal.feedBagsPerMeal.source),
      sourcedEvidence(`${animal.id}.feed-energy`, 'Feed energy', feedingEnergy.energy.source),
      sourcedEvidence(`${animal.id}.collection-energy`, 'Collection energy', collectionEnergy.energy.source),
    ]),
    resultStatus: 'derived',
    metrics: metrics(grossValue, totalFeedCost, cycleHours, energyPerCycle),
    rank: undefined,
  });
}

function cropRows(guide: FarmingSeasonGuide, capture: LocalGameCapture): ReadonlyArray<ObservedProfitabilityRow> {
  return guide.crops.map((crop) => cropRow(crop, guide, capture));
}

function cropRow(
  crop: CropGuide,
  guide: FarmingSeasonGuide,
  capture: LocalGameCapture,
): ObservedProfitabilityRow {
  const payout = observedValueFor(capture.directPayouts, crop.id);
  const seedCost = observedValueFor(capture.directUnitCosts, cropSeedCostKey(crop.id));
  const fieldAction = energyFor(guide, 'plant-or-harvest-field');
  const unitGap = tokenUnitGap([payout, seedCost]);
  const missing = [
    ...(payout === undefined ? [`direct-game payout for ${crop.label.toLowerCase()}`] : []),
    ...(seedCost === undefined ? ['captured seed cost'] : []),
    ...(fieldAction === undefined ? ['official plant and harvest energy rule'] : []),
    ...(unitGap === undefined ? [] : [unitGap]),
  ];
  const evidence = [
    sourcedEvidence(`${crop.id}.duration`, 'Growth duration', crop.growthHours.source),
    ...(fieldAction === undefined ? [] : [sourcedEvidence(`${crop.id}.energy`, 'Plant and harvest energy', fieldAction.energy.source)]),
    ...(payout === undefined ? [] : [sourcedEvidence(`${crop.id}.payout`, 'Direct-game payout', payout.source)]),
    ...(seedCost === undefined ? [] : [sourcedEvidence(`${crop.id}.seed-cost`, 'Seed cost', seedCost.source)]),
  ];
  if (missing.length > 0 || payout === undefined || seedCost === undefined || fieldAction === undefined) {
    return incomplete(crop.id, crop.label, 'crop', missing, evidence);
  }

  return Object.freeze({
    activityId: crop.id,
    label: crop.label,
    category: 'crop',
    state: 'complete',
    observedAt: payout.capturedAt,
    evidence: Object.freeze(evidence),
    resultStatus: 'derived',
    metrics: metrics(payout.value, seedCost.value, crop.growthHours.value, fieldAction.energy.value * 2),
    rank: undefined,
  });
}

function recipeRows(capture: LocalGameCapture): ReadonlyArray<ObservedProfitabilityRow> {
  const listedItems = new Set(capture.market?.aggregates.map((aggregate) => aggregate.item) ?? []);
  return RECIPE_ITEMS
    .filter((item) => listedItems.has(item))
    .map((item) => incomplete(item, item, 'recipe', [
      'recipe inputs and quantities',
      'recipe duration',
      'unit-compatible output payout',
    ]));
}

/**
 * Produces direct-game operating margins only when captured values share a
 * compatible in-game source. Market asks are intentionally excluded until their
 * price unit has been independently validated.
 */
export function buildObservedProfitabilityPlan(
  guide: FarmingSeasonGuide,
  capture: LocalGameCapture,
  actionObservations: ReadonlyArray<ObservedActionObservation> = [],
): ObservedProfitabilityPlan {
  const evaluatedRows = [
    ...guide.animals.map((animal) => animalRow(animal, guide, capture)),
    ...cropRows(guide, capture),
    ...recipeRows(capture),
  ];
  const completeRows = evaluatedRows
    .filter((row): row is Extract<ObservedProfitabilityRow, { state: 'complete' }> => row.state === 'complete')
    .sort((left, right) => (right.metrics.benefitPerEnergy ?? Number.NEGATIVE_INFINITY)
      - (left.metrics.benefitPerEnergy ?? Number.NEGATIVE_INFINITY))
    .map((row, index) => Object.freeze({ ...row, rank: index + 1 }));
  const incompleteRows = evaluatedRows
    .filter((row): row is Extract<ObservedProfitabilityRow, { state: 'incomplete' }> => row.state === 'incomplete');
  const rows = Object.freeze([...completeRows, ...incompleteRows]);

  return Object.freeze({
    capturedAt: capture.farm.capturedAt,
    rows,
    actionObservations: Object.freeze(actionObservations.map((observation) => actionContext(guide, observation))),
    marketPriceUnitState: capture.market?.priceUnitState ?? 'unavailable',
    feeContext: Object.freeze({
      playerMarketSellerFeeRate: guide.playerMarket.sellerFeeRate.value,
      farmBankSellerFeeRate: guide.farmBank.sellerFeeRate.value,
    }),
    ranking: Object.freeze({
      status: completeRows.length >= 2 ? 'available' : 'unavailable',
      metric: 'benefit-per-energy',
      completeActivityCount: completeRows.length,
    }),
  });
}
