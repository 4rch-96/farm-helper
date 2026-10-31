export type AnimalKind = 'chicken' | 'sheep' | 'cow' | 'pig' | string;

export type AnimalSnapshot = Readonly<{
  kind: AnimalKind;
  count: number;
  productReady?: boolean;
}>;

export type FarmSnapshot = Readonly<{
  version: number;
  importedAt: string;
  level: number;
  energy: number;
  dailyEarningLimit?: number;
  dailyEarnings?: number;
  inventory: Readonly<Record<string, number>>;
  silo: Readonly<{ wheat: number; corn: number; feed: number }>;
  animals: ReadonlyArray<AnimalSnapshot>;
}>;

export type FarmSnapshotInput = Omit<FarmSnapshot, 'importedAt'> & { importedAt?: string };

export class FarmSnapshotValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'FarmSnapshotValidationError';
  }
}

function requireNonNegativeFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new FarmSnapshotValidationError(`${label} must be a non-negative finite number.`);
  }

  return value;
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new FarmSnapshotValidationError(`${label} must be a positive integer.`);
  }

  return value;
}

function normalizeRecord(record: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(record).map(([item, quantity]) => [item, requireNonNegativeFinite(quantity, `Inventory ${item}`)]),
    ),
  );
}

export function createFarmSnapshot(input: FarmSnapshotInput): FarmSnapshot {
  const importedAt = input.importedAt ?? new Date().toISOString();

  if (Number.isNaN(Date.parse(importedAt))) {
    throw new FarmSnapshotValidationError('Imported timestamp must be an ISO-compatible date.');
  }

  const animals = input.animals.map((animal) =>
    Object.freeze({
      kind: animal.kind,
      count: requireNonNegativeFinite(animal.count, `${animal.kind} count`),
      ...(animal.productReady === undefined ? {} : { productReady: animal.productReady }),
    }),
  );

  return Object.freeze({
    version: requirePositiveInteger(input.version, 'Snapshot version'),
    importedAt,
    level: requirePositiveInteger(input.level, 'Town Hall level'),
    energy: requireNonNegativeFinite(input.energy, 'Energy'),
    ...(input.dailyEarningLimit === undefined
      ? {}
      : { dailyEarningLimit: requireNonNegativeFinite(input.dailyEarningLimit, 'Daily earning limit') }),
    ...(input.dailyEarnings === undefined
      ? {}
      : { dailyEarnings: requireNonNegativeFinite(input.dailyEarnings, 'Daily earnings') }),
    inventory: normalizeRecord(input.inventory),
    silo: Object.freeze({
      wheat: requireNonNegativeFinite(input.silo.wheat, 'Silo wheat'),
      corn: requireNonNegativeFinite(input.silo.corn, 'Silo corn'),
      feed: requireNonNegativeFinite(input.silo.feed, 'Silo feed'),
    }),
    animals: Object.freeze(animals),
  });
}

export function isActivityUnlocked(snapshot: FarmSnapshot, requiredLevel: number): boolean {
  return snapshot.level >= requiredLevel;
}

export function remainingDailyEarningCapacity(snapshot: FarmSnapshot): number | undefined {
  if (snapshot.dailyEarningLimit === undefined || snapshot.dailyEarnings === undefined) {
    return undefined;
  }

  return Math.max(0, snapshot.dailyEarningLimit - snapshot.dailyEarnings);
}
