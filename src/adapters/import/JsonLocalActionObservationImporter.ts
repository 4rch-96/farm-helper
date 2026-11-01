import {
  createObservedActionObservation,
  type ObservedActionKind,
  type ObservedActionObservation,
} from '../../domain/observations/LocalGameCapture';
import type { FactSource } from '../../domain/economy/EconomyCatalog';

type UnknownRecord = Record<string, unknown>;

type ActionObservationImportInput = Readonly<{
  before: string;
  after: string;
  receipt: string;
}>;

export type ActionObservationImportResult =
  | Readonly<{ ok: true; observation: ObservedActionObservation; warnings: ReadonlyArray<string> }>
  | Readonly<{ ok: false; message: string; warnings: ReadonlyArray<string> }>;

type SafeFarmState = Readonly<{
  capturedAt: string;
  version: number;
  townHallLevel: number;
  energy: number;
  tokens: number;
  silo: Readonly<Record<string, number>>;
  crops: Readonly<Record<string, number>>;
}>;

const CREDENTIAL_FIELD = /^(?:fs)?session(?:token)?$|^(?:access|auth|refresh|id)?token$|^cookies?$|^authorization$|^privatekey$|^seedphrase$|^mnemonic$|^secret$/i;
const HARVEST_TO_SILO = /^(.+?) is in your silo\.$/i;
const PLANT = /^(.+?) planted\.$/i;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordAt(value: unknown, label: string): UnknownRecord {
  if (!isRecord(value)) throw new Error(`${label} is missing or invalid.`);
  return value;
}

function numberAt(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} is missing or invalid.`);
  }

  return value;
}

function normalizeItem(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function hasCredentialField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasCredentialField);
  if (!isRecord(value)) return false;

  return Object.entries(value).some(([key, nested]) =>
    CREDENTIAL_FIELD.test(key.replace(/[_-]/g, '')) || hasCredentialField(nested));
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error('An action capture is not valid JSON.');
  }
}

function captureTimestamp(value: unknown): string {
  const timestamp = numberAt(value, 'Capture timestamp');
  const capturedAt = new Date(timestamp);
  if (Number.isNaN(capturedAt.getTime())) throw new Error('Capture timestamp is invalid.');
  return capturedAt.toISOString();
}

function numberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) =>
      typeof item === 'number' && Number.isFinite(item) ? [[normalizeItem(key), item]] : []),
  );
}

function cropCounts(value: unknown): Record<string, number> {
  if (!Array.isArray(value)) return {};
  const counts: Record<string, number> = {};
  for (const field of value) {
    if (!isRecord(field) || typeof field.crop !== 'string') continue;
    const item = normalizeItem(field.crop);
    counts[item] = (counts[item] ?? 0) + 1;
  }

  return counts;
}

function farmState(payload: unknown, label: string): SafeFarmState {
  const root = recordAt(payload, label);
  const farm = isRecord(root.farm) ? root.farm : root;
  const today = isRecord(farm.today) ? farm.today : {};

  return Object.freeze({
    capturedAt: captureTimestamp(root.now ?? farm.now),
    version: numberAt(farm.version, 'Farm version'),
    townHallLevel: numberAt(farm.level, 'Town Hall level'),
    energy: numberAt(today.energy ?? farm.energy, 'Farm energy'),
    tokens: numberAt(farm.tokens, 'Farm tokens'),
    silo: Object.freeze(numberRecord(farm.silo)),
    crops: Object.freeze(cropCounts(farm.fields)),
  });
}

function deltas(before: Readonly<Record<string, number>>, after: Readonly<Record<string, number>>): Record<string, number> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return Object.fromEntries([...keys].flatMap((key) => {
    const delta = (after[key] ?? 0) - (before[key] ?? 0);
    return delta === 0 ? [] : [[key, delta]];
  }));
}

function receiptAction(payload: unknown): Readonly<{ kind: ObservedActionKind; item: string }> {
  const root = recordAt(payload, 'Operation receipt');
  if (!Array.isArray(root.results)) throw new Error('Operation receipt is missing results.');

  const successful = root.results.find((result) => isRecord(result) && result.ok === true && typeof result.msg === 'string');
  if (!isRecord(successful) || typeof successful.msg !== 'string') {
    throw new Error('Operation receipt does not contain a successful supported action.');
  }

  const harvest = successful.msg.match(HARVEST_TO_SILO);
  if (harvest !== null) return Object.freeze({ kind: 'harvest-to-silo', item: normalizeItem(harvest[1]) });

  const plant = successful.msg.match(PLANT);
  if (plant !== null) return Object.freeze({ kind: 'plant', item: normalizeItem(plant[1]) });

  throw new Error('Operation receipt action is not supported for observation.');
}

function observedSource(capturedAt: string, kind: ObservedActionKind): FactSource {
  return Object.freeze({
    kind: 'captured-game-ui',
    reference: `Player-provided local operation observation: ${kind}`,
    observedAt: capturedAt.slice(0, 10),
    dateKind: 'observed',
    confidence: 'captured',
  });
}

function quantityFor(
  action: Readonly<{ kind: ObservedActionKind; item: string }>,
  siloDeltas: Readonly<Record<string, number>>,
  fieldDeltas: Readonly<Record<string, number>>,
): number {
  const quantity = action.kind === 'harvest-to-silo'
    ? siloDeltas[action.item]
    : fieldDeltas[action.item];
  if (quantity === undefined || !Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Ordered captures do not contain a positive matching action delta.');
  }

  return quantity;
}

/**
 * Derives a narrow, privacy-preserving action fact from ordered local captures.
 * It parses source JSON in memory only and never returns receipt text or identity fields.
 */
export class JsonLocalActionObservationImporter {
  public import(input: ActionObservationImportInput): ActionObservationImportResult {
    let beforePayload: unknown;
    let afterPayload: unknown;
    let receiptPayload: unknown;
    try {
      beforePayload = parseJson(input.before);
      afterPayload = parseJson(input.after);
      receiptPayload = parseJson(input.receipt);
    } catch (error) {
      return Object.freeze({
        ok: false,
        message: error instanceof Error ? error.message : 'The action capture could not be validated.',
        warnings: Object.freeze([]),
      });
    }

    const warnings = hasCredentialField(beforePayload) || hasCredentialField(afterPayload) || hasCredentialField(receiptPayload)
      ? ['Credential-shaped fields were discarded. Revoke them before sharing a capture.']
      : [];

    try {
      const before = farmState(beforePayload, 'Before capture');
      const after = farmState(afterPayload, 'After capture');
      if (Date.parse(after.capturedAt) <= Date.parse(before.capturedAt)) {
        throw new Error('After capture must be newer than before capture.');
      }
      if (after.version !== before.version || after.townHallLevel !== before.townHallLevel) {
        throw new Error('Ordered captures are not compatible for one action observation.');
      }

      const action = receiptAction(receiptPayload);
      const siloDeltas = deltas(before.silo, after.silo);
      const fieldDeltas = deltas(before.crops, after.crops);
      const quantity = quantityFor(action, siloDeltas, fieldDeltas);
      const observation = createObservedActionObservation({
        kind: action.kind,
        scope: 'batch',
        item: action.item,
        quantity,
        beforeCapturedAt: before.capturedAt,
        observedAt: after.capturedAt,
        energyDelta: after.energy - before.energy,
        tokenDelta: after.tokens - before.tokens,
        siloDeltas,
        fieldDeltas,
        source: observedSource(after.capturedAt, action.kind),
      });

      return Object.freeze({ ok: true, observation, warnings: Object.freeze(warnings) });
    } catch (error) {
      return Object.freeze({
        ok: false,
        message: error instanceof Error ? error.message : 'The action capture could not be validated.',
        warnings: Object.freeze(warnings),
      });
    }
  }
}
