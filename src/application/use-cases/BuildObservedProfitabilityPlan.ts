import type { FarmingSeasonGuide, AnimalGuide, EnergyActionGuide } from '../../domain/guide/FarmingSeasonGuide';
import type { LocalGameCapture, ObservedValue } from '../../domain/observations/LocalGameCapture';

export type ObservedProfitabilityMetrics = Readonly<{
  grossValue: number;
  feedCost: number;
  feeAmount: number;
  netPerCycle: number;
  netPerHour: number;
  netPerEnergy: number;
  cycleHours: number;
  energyPerCycle: number;
}>;

export type ObservedProfitabilityRow =
  | Readonly<{
    activityId: string;
    label: string;
    category: 'animal';
    state: 'complete';
    observedAt: string;
    animalCount: number;
    buildingCount: number;
    saleRoute: 'direct-game-payout';
    metrics: ObservedProfitabilityMetrics;
    rank: number | undefined;
  }>
  | Readonly<{
    activityId: string;
    label: string;
    category: 'animal' | 'crop' | 'recipe';
    state: 'incomplete';
    missing: ReadonlyArray<string>;
    rank: undefined;
  }>;

export type ObservedProfitabilityPlan = Readonly<{
  capturedAt: string;
  rows: ReadonlyArray<ObservedProfitabilityRow>;
  marketPriceUnitState: 'unavailable' | 'unit-validation-pending';
  feeContext: Readonly<{
    playerMarketSellerFeeRate: number;
    farmBankSellerFeeRate: number;
  }>;
  ranking: Readonly<{
    status: 'available' | 'unavailable';
    completeActivityCount: number;
  }>;
}>;

const BUILDING_KIND_BY_ANIMAL: Readonly<Record<string, string>> = Object.freeze({
  chicken: 'coop',
  sheep: 'sheepPen',
  cow: 'barn',
  pig: 'pigPen',
});

const RECIPE_ITEMS = Object.freeze(['flour', 'bread', 'cheese', 'butter', 'jam', 'cloth', 'juice']);

function energyFor(guide: FarmingSeasonGuide, id: string): EnergyActionGuide | undefined {
  return guide.energyActions.find((action) => action.id === id);
}

function observedValueFor(values: Readonly<Record<string, ObservedValue>>, item: string): ObservedValue | undefined {
  return values[item.toLowerCase()];
}

function incomplete(
  activityId: string,
  label: string,
  category: 'animal' | 'crop' | 'recipe',
  missing: ReadonlyArray<string>,
): ObservedProfitabilityRow {
  return Object.freeze({
    activityId,
    label,
    category,
    state: 'incomplete',
    missing: Object.freeze([...missing]),
    rank: undefined,
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
  const missing = [
    ...(buildingCount > 0 ? [] : ['captured building count']),
    ...(payout === undefined ? [`direct-game payout for ${animal.product.toLowerCase()}`] : []),
    ...(feedCost === undefined ? ['captured feed unit cost'] : []),
    ...(feedingEnergy === undefined ? ['official feeding energy rule'] : []),
    ...(collectionEnergy === undefined ? ['official collection energy rule'] : []),
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
  const netPerCycle = grossValue - totalFeedCost;

  return Object.freeze({
    activityId: animal.id,
    label: animal.label,
    category: 'animal',
    state: 'complete',
    observedAt: payout.capturedAt,
    animalCount,
    buildingCount,
    saleRoute: 'direct-game-payout',
    metrics: Object.freeze({
      grossValue,
      feedCost: totalFeedCost,
      feeAmount: 0,
      netPerCycle,
      netPerHour: netPerCycle / cycleHours,
      netPerEnergy: energyPerCycle === 0 ? 0 : netPerCycle / energyPerCycle,
      cycleHours,
      energyPerCycle,
    }),
    rank: undefined,
  });
}

function cropRows(guide: FarmingSeasonGuide, capture: LocalGameCapture): ReadonlyArray<ObservedProfitabilityRow> {
  return Object.keys(capture.directPayouts)
    .filter((item) => guide.crops.some((crop) => crop.id === item))
    .map((item) => {
      const crop = guide.crops.find((candidate) => candidate.id === item);
      return incomplete(item, crop?.label ?? item, 'crop', ['captured seed cost']);
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
): ObservedProfitabilityPlan {
  const completeAnimals = guide.animals
    .map((animal) => animalRow(animal, guide, capture))
    .filter((row): row is Extract<ObservedProfitabilityRow, { state: 'complete' }> => row.state === 'complete')
    .sort((left, right) => right.metrics.netPerEnergy - left.metrics.netPerEnergy)
    .map((row, index) => Object.freeze({ ...row, rank: index + 1 }));

  const incompleteAnimals = guide.animals
    .map((animal) => animalRow(animal, guide, capture))
    .filter((row): row is Extract<ObservedProfitabilityRow, { state: 'incomplete' }> => row.state === 'incomplete');

  const rows = Object.freeze([
    ...completeAnimals,
    ...incompleteAnimals,
    ...cropRows(guide, capture),
    ...recipeRows(capture),
  ]);

  return Object.freeze({
    capturedAt: capture.farm.capturedAt,
    rows,
    marketPriceUnitState: capture.market?.priceUnitState ?? 'unavailable',
    feeContext: Object.freeze({
      playerMarketSellerFeeRate: guide.playerMarket.sellerFeeRate.value,
      farmBankSellerFeeRate: guide.farmBank.sellerFeeRate.value,
    }),
    ranking: Object.freeze({
      status: completeAnimals.length >= 2 ? 'available' : 'unavailable',
      completeActivityCount: completeAnimals.length,
    }),
  });
}
