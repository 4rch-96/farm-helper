import type { FactSource } from '../economy/EconomyCatalog';

export type ObservedValue = Readonly<{
  value: number;
  source: FactSource;
  capturedAt: string;
}>;

export type ObservedFarmState = Readonly<{
  capturedAt: string;
  townHallLevel: number;
  energy: number;
  animalCounts: Readonly<Record<string, number>>;
  buildingCounts: Readonly<Record<string, number>>;
}>;

export type MarketPriceUnitState = 'unit-validation-pending';

export type MarketListingAggregate = Readonly<{
  item: string;
  activeListingCount: number;
  totalQuantity: number;
  lowestPrice: number;
  medianPrice: number;
  highestPrice: number;
}>;

export type ObservedMarketListings = Readonly<{
  capturedAt: string;
  priceUnitState: MarketPriceUnitState;
  aggregates: ReadonlyArray<MarketListingAggregate>;
}>;

/**
 * A privacy-preserving projection of a player-provided local game capture.
 * It deliberately excludes identifiers, names, credentials, referral data,
 * telemetry, free-form log text and the original raw JSON.
 */
export type LocalGameCapture = Readonly<{
  farm: ObservedFarmState;
  directPayouts: Readonly<Record<string, ObservedValue>>;
  directUnitCosts: Readonly<Record<string, ObservedValue>>;
  market?: ObservedMarketListings;
}>;

function assertFiniteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number.`);
  }

  return value;
}

function assertIsoTimestamp(value: string, label: string): string {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO-compatible timestamp.`);
  }

  return value;
}

function freezeRecord(values: Readonly<Record<string, number>>, label: string): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, assertFiniteNonNegative(value, `${label} ${key}`)]),
  ));
}

function freezeObservedValues(
  values: Readonly<Record<string, ObservedValue>>,
  label: string,
): Readonly<Record<string, ObservedValue>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Object.freeze({
      value: assertFiniteNonNegative(value.value, `${label} ${key}`),
      source: value.source,
      capturedAt: assertIsoTimestamp(value.capturedAt, `${label} ${key} capture time`),
    })]),
  ));
}

export function createLocalGameCapture(input: LocalGameCapture): LocalGameCapture {
  const farm = Object.freeze({
    capturedAt: assertIsoTimestamp(input.farm.capturedAt, 'Farm capture time'),
    townHallLevel: assertFiniteNonNegative(input.farm.townHallLevel, 'Town Hall level'),
    energy: assertFiniteNonNegative(input.farm.energy, 'Farm energy'),
    animalCounts: freezeRecord(input.farm.animalCounts, 'Animal count'),
    buildingCounts: freezeRecord(input.farm.buildingCounts, 'Building count'),
  });

  const market = input.market === undefined ? undefined : Object.freeze({
    capturedAt: assertIsoTimestamp(input.market.capturedAt, 'Market capture time'),
    priceUnitState: input.market.priceUnitState,
    aggregates: Object.freeze(input.market.aggregates.map((aggregate) => Object.freeze({
      item: aggregate.item,
      activeListingCount: assertFiniteNonNegative(aggregate.activeListingCount, `${aggregate.item} listing count`),
      totalQuantity: assertFiniteNonNegative(aggregate.totalQuantity, `${aggregate.item} quantity`),
      lowestPrice: assertFiniteNonNegative(aggregate.lowestPrice, `${aggregate.item} lowest price`),
      medianPrice: assertFiniteNonNegative(aggregate.medianPrice, `${aggregate.item} median price`),
      highestPrice: assertFiniteNonNegative(aggregate.highestPrice, `${aggregate.item} highest price`),
    }))),
  });

  return Object.freeze({
    farm,
    directPayouts: freezeObservedValues(input.directPayouts, 'Direct payout'),
    directUnitCosts: freezeObservedValues(input.directUnitCosts, 'Direct unit cost'),
    ...(market === undefined ? {} : { market }),
  });
}
