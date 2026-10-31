import {
  isCatalogFactUsable,
  type CatalogEvidenceGap,
  type CatalogFact,
  type FactSource,
} from './EconomyCatalog';

export type TownHallLevel = 1 | 2 | 3 | 4 | 5;

export type TownHallCapacity = Readonly<{
  id: string;
  label: string;
  value: CatalogFact;
}>;

export type ApplicableTownHallCapacity = Readonly<{
  id: string;
  label: string;
  value: number;
  fact: CatalogFact;
}>;

export type TownHallRule = Readonly<{
  level: TownHallLevel;
  capacities: ReadonlyArray<TownHallCapacity>;
  valueMultiplier: CatalogFact;
}>;

export type TownHallRules = Readonly<{
  levels: ReadonlyArray<TownHallRule>;
}>;

export type TownHallActivityEligibility =
  | Readonly<{ state: 'eligible'; requiredLevel: TownHallLevel; missingFacts: ReadonlyArray<never> }>
  | Readonly<{ state: 'locked'; requiredLevel: TownHallLevel; missingFacts: ReadonlyArray<never> }>
  | Readonly<{ state: 'incomplete'; missingFacts: ReadonlyArray<CatalogEvidenceGap> }>;

export type TownHallMultiplierResult =
  | Readonly<{ ok: true; value: number; fact: CatalogFact; missingFacts: ReadonlyArray<never> }>
  | Readonly<{ ok: false; missingFacts: ReadonlyArray<CatalogEvidenceGap> }>;

export type TownHallCapacityResult = Readonly<{
  capacities: ReadonlyArray<ApplicableTownHallCapacity>;
  missingFacts: ReadonlyArray<CatalogEvidenceGap>;
}>;

export class TownHallLevelValidationError extends Error {
  public constructor(level: number) {
    super('Town Hall level must be an integer from 1 through 5.');
    this.name = 'TownHallLevelValidationError';
  }
}

const UNKNOWN_TOWN_HALL_SOURCE: FactSource = Object.freeze({
  kind: 'unknown',
  reference: 'Catalog review: no admissible Farming Season source is recorded for this Town Hall fact.',
  observedAt: '2026-10-31',
  dateKind: 'catalog-review',
  confidence: 'unknown',
});

function unknownTownHallFact(id: string, label: string, unit: CatalogFact['unit']): CatalogFact {
  return Object.freeze({ id, label, value: 'unknown', unit, source: UNKNOWN_TOWN_HALL_SOURCE });
}

function evidenceGap(fact: CatalogFact): CatalogEvidenceGap {
  return Object.freeze({ factId: fact.id, factLabel: fact.label, source: fact.source });
}

function asRequiredLevel(fact: CatalogFact): TownHallLevel | undefined {
  if (typeof fact.value !== 'number' || !isCatalogFactUsable(fact) || !Number.isInteger(fact.value) || fact.value < 1 || fact.value > 5) {
    return undefined;
  }

  return fact.value as TownHallLevel;
}

export function validateTownHallLevel(level: number): TownHallLevel {
  if (!Number.isInteger(level) || level < 1 || level > 5) {
    throw new TownHallLevelValidationError(level);
  }

  return level as TownHallLevel;
}

export function createTownHallRules(levels: ReadonlyArray<TownHallRule>): TownHallRules {
  if (levels.length !== 5) {
    throw new TownHallLevelValidationError(levels.length);
  }

  const sorted = [...levels].sort((left, right) => left.level - right.level);
  for (const [index, rule] of sorted.entries()) {
    if (rule.level !== index + 1) {
      throw new TownHallLevelValidationError(rule.level);
    }
  }

  return Object.freeze({
    levels: Object.freeze(sorted.map((rule) => Object.freeze({
      ...rule,
      capacities: Object.freeze([...rule.capacities]),
    }))),
  });
}

export function getTownHallRule(rules: TownHallRules, level: number): TownHallRule {
  const validLevel = validateTownHallLevel(level);
  const rule = rules.levels.find((candidate) => candidate.level === validLevel);
  if (rule === undefined) {
    throw new TownHallLevelValidationError(validLevel);
  }

  return rule;
}

export function getTownHallValueMultiplier(rules: TownHallRules, level: number): TownHallMultiplierResult {
  const fact = getTownHallRule(rules, level).valueMultiplier;
  if (typeof fact.value !== 'number' || !isCatalogFactUsable(fact) || fact.value < 0) {
    return Object.freeze({ ok: false, missingFacts: Object.freeze([evidenceGap(fact)]) });
  }

  return Object.freeze({ ok: true, value: fact.value, fact, missingFacts: Object.freeze([]) });
}

export function getTownHallCapacities(rules: TownHallRules, level: number): TownHallCapacityResult {
  const capacities = getTownHallRule(rules, level).capacities;
  const usable = capacities.filter((capacity) => typeof capacity.value.value === 'number'
    && capacity.value.value >= 0
    && isCatalogFactUsable(capacity.value));

  return Object.freeze({
    capacities: Object.freeze(usable.map((capacity) => Object.freeze({
      id: capacity.id,
      label: capacity.label,
      value: capacity.value.value as number,
      fact: capacity.value,
    }))),
    missingFacts: Object.freeze(capacities
      .filter((capacity) => !usable.includes(capacity))
      .map((capacity) => evidenceGap(capacity.value))),
  });
}

export function getTownHallCapacityEvidenceGaps(rules: TownHallRules, level: number): ReadonlyArray<CatalogEvidenceGap> {
  return getTownHallCapacities(rules, level).missingFacts;
}

export function evaluateTownHallActivityEligibility(
  selectedLevel: number,
  requiredLevel: CatalogFact,
): TownHallActivityEligibility {
  const level = validateTownHallLevel(selectedLevel);
  const required = asRequiredLevel(requiredLevel);
  if (required === undefined) {
    return Object.freeze({ state: 'incomplete', missingFacts: Object.freeze([evidenceGap(requiredLevel)]) });
  }

  return Object.freeze({
    state: level >= required ? 'eligible' : 'locked',
    requiredLevel: required,
    missingFacts: Object.freeze([]),
  });
}

function unknownTownHallRule(level: TownHallLevel): TownHallRule {
  return Object.freeze({
    level,
    capacities: Object.freeze([
      Object.freeze({
        id: `town-hall.${level}.field-capacity`,
        label: 'Field capacity',
        value: unknownTownHallFact(`town-hall.${level}.field-capacity`, 'Field capacity', 'items'),
      }),
      Object.freeze({
        id: `town-hall.${level}.building-capacity`,
        label: 'Building capacity',
        value: unknownTownHallFact(`town-hall.${level}.building-capacity`, 'Building capacity', 'items'),
      }),
      Object.freeze({
        id: `town-hall.${level}.animal-capacity`,
        label: 'Animal capacity',
        value: unknownTownHallFact(`town-hall.${level}.animal-capacity`, 'Animal capacity', 'items'),
      }),
    ]),
    valueMultiplier: unknownTownHallFact(`town-hall.${level}.value-multiplier`, 'Value multiplier', 'multiplier'),
  });
}

/**
 * The levels themselves are known planner boundaries. Their capacity and value
 * facts remain explicit unknowns until admissible Farming Season evidence is
 * recorded; callers must not turn them into default values.
 */
export const FARMING_SEASON_TOWN_HALL_RULES: TownHallRules = createTownHallRules([
  unknownTownHallRule(1),
  unknownTownHallRule(2),
  unknownTownHallRule(3),
  unknownTownHallRule(4),
  unknownTownHallRule(5),
]);
