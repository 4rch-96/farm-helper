import {
  createFarmSnapshot,
  type AnimalSnapshot,
  type FarmSnapshotInput,
} from '../../domain/farm/FarmSnapshot';
import type { FarmSnapshotImportResult, FarmSnapshotProvider } from '../../application/ports/FarmSnapshotProvider';

const SUPPORTED_VERSION = 2;
const CREDENTIAL_FIELD = /^(?:fs)?session(?:token)?$|^(?:access|auth|refresh|id)?token$|^cookies?$|^authorization$|^privatekey$|^seedphrase$|^mnemonic$|^secret$/i;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberAt(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} is missing or invalid.`);
  }

  return value;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function recordOfNumbers(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number' && Number.isFinite(item)) {
      result[key] = item;
    }
  }

  return result;
}

function hasCredentialField(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasCredentialField);
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(([key, nested]) => CREDENTIAL_FIELD.test(key.replace(/[_-]/g, '')) || hasCredentialField(nested));
}

function normalizeAnimals(value: unknown): AnimalSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const counts = new Map<string, { count: number; productReady: boolean }>();
  for (const animal of value) {
    if (!isRecord(animal) || typeof animal.kind !== 'string') {
      continue;
    }

    const previous = counts.get(animal.kind) ?? { count: 0, productReady: false };
    counts.set(animal.kind, {
      count: previous.count + 1,
      productReady: previous.productReady || animal.productReady === true,
    });
  }

  return [...counts.entries()].map(([kind, value]) => ({ kind, ...value }));
}

function normalizeSnapshot(raw: unknown): FarmSnapshotInput {
  if (!isRecord(raw)) {
    throw new Error('The import must be a JSON object.');
  }

  const farm = isRecord(raw.farm) ? raw.farm : raw;
  const today = isRecord(farm.today) ? farm.today : {};
  const version = numberAt(farm.version, 'Snapshot version');
  if (version !== SUPPORTED_VERSION) {
    throw new Error(`Snapshot version ${version} is not supported.`);
  }

  const silo = recordOfNumbers(farm.silo);
  if (silo.wheat === undefined || silo.corn === undefined || silo.feed === undefined) {
    throw new Error('The snapshot is missing silo amounts needed for analysis.');
  }

  const inventory = {
    ...recordOfNumbers(farm.goods),
    ...recordOfNumbers(farm.pantry),
    ...recordOfNumbers(farm.keep),
  };
  const directInventory = recordOfNumbers(farm.inventory);

  return {
    version,
    importedAt: typeof raw.now === 'number' ? new Date(raw.now).toISOString() : undefined,
    level: numberAt(farm.level, 'Town Hall level'),
    energy: numberAt(today.energy ?? farm.energy, 'Energy'),
    dailyEarningLimit: optionalNumber(today.dailyEarningLimit ?? farm.dailyEarningLimit),
    dailyEarnings: optionalNumber(today.harvestEarned ?? farm.dailyEarnings),
    inventory: { ...inventory, ...directInventory },
    silo: { wheat: silo.wheat, corn: silo.corn, feed: silo.feed },
    animals: normalizeAnimals(farm.animals),
  };
}

export class JsonFarmSnapshotImporter implements FarmSnapshotProvider {
  public import(raw: string): FarmSnapshotImportResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return { ok: false, message: 'The selected file is not valid JSON.', warnings: [] };
    }

    const warnings = hasCredentialField(parsed)
      ? ['A credential-shaped field was excluded. Remove or revoke the credential before sharing this file.']
      : [];

    try {
      return { ok: true, snapshot: createFarmSnapshot(normalizeSnapshot(parsed)), warnings };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'The snapshot could not be validated.',
        warnings,
      };
    }
  }
}
