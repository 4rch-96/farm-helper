import {
  createLocalGameCapture,
  type LocalGameCapture,
  type MarketListingAggregate,
  type ObservedValue,
} from '../../domain/observations/LocalGameCapture';
import type { FactSource } from '../../domain/economy/EconomyCatalog';

type UnknownRecord = Record<string, unknown>;

type LocalGameCaptureImportResult =
  | Readonly<{ ok: true; capture: LocalGameCapture; warnings: ReadonlyArray<string> }>
  | Readonly<{ ok: false; message: string; warnings: ReadonlyArray<string> }>;

const CREDENTIAL_FIELD = /^(?:fs)?session(?:token)?$|^(?:access|auth|refresh|id)?token$|^cookies?$|^authorization$|^privatekey$|^seedphrase$|^mnemonic$|^secret$/i;
const DIRECT_PAYOUT = /^Collected ([a-z][a-z ]*) \(\+([\d.]+) SEASON\)$/i;
const CROP_PAYOUT = /^Field \d+: harvested ([a-z][a-z ]+) \(\+([\d.]+) SEASON\)$/i;
const FEED_PURCHASE = /^Market: bought (\d+) feed bag(?:s)? from .+ \(−([\d.]+) SEASON\)$/i;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasCredentialField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasCredentialField);
  if (!isRecord(value)) return false;

  return Object.entries(value).some(([key, nested]) =>
    CREDENTIAL_FIELD.test(key.replace(/[_-]/g, '')) || hasCredentialField(nested));
}

function numberAt(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} is missing or invalid.`);
  }

  return value;
}

function recordAt(value: unknown, label: string): UnknownRecord {
  if (!isRecord(value)) throw new Error(`${label} is missing or invalid.`);
  return value;
}

function captureTimestamp(value: unknown): string {
  const timestamp = numberAt(value, 'Capture timestamp');
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) throw new Error('Capture timestamp is invalid.');
  return date.toISOString();
}

function observedSource(capturedAt: string, location: string): FactSource {
  return Object.freeze({
    kind: 'captured-game-ui',
    reference: `Player-provided local game capture: ${location}`,
    observedAt: capturedAt.slice(0, 10),
    dateKind: 'observed',
    confidence: 'captured',
  });
}

function normalizeItem(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function countKinds(value: unknown): Record<string, number> {
  if (!Array.isArray(value)) return {};
  const counts: Record<string, number> = {};
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.kind !== 'string') continue;
    counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
  }

  return counts;
}

function median(values: ReadonlyArray<number>): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function observedValue(value: number, capturedAt: string, location: string): ObservedValue {
  return Object.freeze({ value, capturedAt, source: observedSource(capturedAt, location) });
}

function parseObservedValues(log: unknown, capturedAt: string): Readonly<{
  payouts: Record<string, ObservedValue>;
  costs: Record<string, ObservedValue>;
}> {
  const payoutSamples = new Map<string, number[]>();
  const feedUnitCosts: number[] = [];

  if (Array.isArray(log)) {
    for (const entry of log) {
      if (!isRecord(entry) || typeof entry.text !== 'string') continue;
      const direct = entry.text.match(DIRECT_PAYOUT);
      const crop = entry.text.match(CROP_PAYOUT);
      const payout = direct ?? crop;
      if (payout !== null) {
        const item = normalizeItem(payout[1]);
        const amount = Number(payout[2]);
        if (Number.isFinite(amount) && amount >= 0) {
          const samples = payoutSamples.get(item) ?? [];
          samples.push(amount);
          payoutSamples.set(item, samples);
        }
        continue;
      }

      const feedPurchase = entry.text.match(FEED_PURCHASE);
      if (feedPurchase !== null) {
        const quantity = Number(feedPurchase[1]);
        const totalCost = Number(feedPurchase[2]);
        if (Number.isFinite(quantity) && quantity > 0 && Number.isFinite(totalCost) && totalCost >= 0) {
          feedUnitCosts.push(totalCost / quantity);
        }
      }
    }
  }

  const payouts: Record<string, ObservedValue> = {};
  for (const [item, samples] of payoutSamples) {
    payouts[item] = observedValue(median(samples), capturedAt, 'activity log payout');
  }

  const costs: Record<string, ObservedValue> = {};
  if (feedUnitCosts.length > 0) {
    costs.feed = observedValue(median(feedUnitCosts), capturedAt, 'activity log feed purchase');
  }

  return Object.freeze({ payouts, costs });
}

function aggregateListings(value: unknown): ReadonlyArray<MarketListingAggregate> | undefined {
  if (!Array.isArray(value)) return undefined;

  const groups = new Map<string, Readonly<{ prices: number[]; quantity: number; count: number }>>();
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.item !== 'string') continue;
    const price = entry.price;
    const quantity = entry.qty;
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0
      || typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) {
      continue;
    }

    const item = normalizeItem(entry.item);
    const previous = groups.get(item) ?? Object.freeze({ prices: [], quantity: 0, count: 0 });
    groups.set(item, Object.freeze({
      prices: [...previous.prices, price],
      quantity: previous.quantity + quantity,
      count: previous.count + 1,
    }));
  }

  return Object.freeze([...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([item, group]) => Object.freeze({
      item,
      activeListingCount: group.count,
      totalQuantity: group.quantity,
      lowestPrice: Math.min(...group.prices),
      medianPrice: median(group.prices),
      highestPrice: Math.max(...group.prices),
    })));
}

/**
 * Projects player-provided game/market JSON into minimum local planning facts.
 * The source payload is parsed in-memory only; no raw input or private identity
 * field is returned by this adapter.
 */
export class JsonLocalGameCaptureImporter {
  public import(raw: string): LocalGameCaptureImportResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return Object.freeze({ ok: false, message: 'The capture is not valid JSON.', warnings: Object.freeze([]) });
    }

    const warnings = hasCredentialField(parsed)
      ? ['Credential-shaped fields were discarded. Revoke them before sharing a capture.']
      : [];

    try {
      const root = recordAt(parsed, 'Capture');
      const farm = isRecord(root.farm) ? root.farm : root;
      const capturedAt = captureTimestamp(root.now ?? farm.now);
      const today = isRecord(farm.today) ? farm.today : {};
      const observed = parseObservedValues(farm.log, capturedAt);
      const listings = aggregateListings(root.listings);
      const capture = createLocalGameCapture({
        farm: {
          capturedAt,
          townHallLevel: numberAt(farm.level, 'Town Hall level'),
          energy: numberAt(today.energy ?? farm.energy, 'Farm energy'),
          animalCounts: countKinds(farm.animals),
          buildingCounts: countKinds(farm.structures),
        },
        directPayouts: observed.payouts,
        directUnitCosts: observed.costs,
        ...(listings === undefined ? {} : {
          market: {
            capturedAt,
            priceUnitState: 'unit-validation-pending' as const,
            aggregates: listings,
          },
        }),
      });

      return Object.freeze({ ok: true, capture, warnings: Object.freeze(warnings) });
    } catch (error) {
      return Object.freeze({
        ok: false,
        message: error instanceof Error ? error.message : 'The capture could not be validated.',
        warnings: Object.freeze(warnings),
      });
    }
  }
}
