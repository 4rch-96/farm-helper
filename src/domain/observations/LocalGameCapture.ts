import type { FactSource } from '../economy/EconomyCatalog';

/** Retained unit prevents the planner from combining receipts with unvalidated values. */
export type ObservedValueUnit = 'game-token' | 'unknown';

export type ObservedValue = Readonly<{
  value: number;
  unit: ObservedValueUnit;
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
      unit: value.unit === 'game-token' ? 'game-token' : 'unknown',
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

/** A single player-observed batch operation derived from ordered local captures. */
export type ObservedActionKind = 'harvest-to-silo' | 'plant';

export type ObservedActionObservation = Readonly<{
  kind: ObservedActionKind;
  scope: 'batch';
  item: string;
  quantity: number;
  beforeCapturedAt: string;
  observedAt: string;
  energyDelta: number;
  tokenDelta: number;
  siloDeltas: Readonly<Record<string, number>>;
  fieldDeltas: Readonly<Record<string, number>>;
  source: FactSource;
}>;

function assertFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite.`);
  }

  return value;
}

function freezeDeltaRecord(values: Readonly<Record<string, number>>, label: string): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== 0)
      .map(([key, value]) => [key, assertFinite(value, `${label} ${key}`)]),
  ));
}

/**
 * Creates a privacy-preserving action observation. It captures only the deltas
 * for one observed batch and makes no claim about a general game rule.
 */
export function createObservedActionObservation(input: ObservedActionObservation): ObservedActionObservation {
  const beforeTimestamp = assertIsoTimestamp(input.beforeCapturedAt, 'Action before capture time');
  const observedTimestamp = assertIsoTimestamp(input.observedAt, 'Action observation time');
  if (Date.parse(observedTimestamp) <= Date.parse(beforeTimestamp)) {
    throw new Error('Action observation must follow its before capture.');
  }
  if (!input.item.trim()) {
    throw new Error('Action item is required.');
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('Action quantity must be a positive finite number.');
  }

  return Object.freeze({
    kind: input.kind,
    scope: 'batch',
    item: input.item,
    quantity: input.quantity,
    beforeCapturedAt: beforeTimestamp,
    observedAt: observedTimestamp,
    energyDelta: assertFinite(input.energyDelta, 'Action energy delta'),
    tokenDelta: assertFinite(input.tokenDelta, 'Action token delta'),
    siloDeltas: freezeDeltaRecord(input.siloDeltas, 'Silo delta'),
    fieldDeltas: freezeDeltaRecord(input.fieldDeltas, 'Field delta'),
    source: input.source,
  });
}
