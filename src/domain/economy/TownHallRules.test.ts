import { describe, expect, it } from 'vitest';
import type { CatalogFact } from './EconomyCatalog';
import {
  FARMING_SEASON_TOWN_HALL_RULES,
  TownHallLevelValidationError,
  createTownHallRules,
  evaluateTownHallActivityEligibility,
  getTownHallCapacityEvidenceGaps,
  getTownHallCapacities,
  getTownHallRule,
  getTownHallValueMultiplier,
  validateTownHallLevel,
  type TownHallRule,
} from './TownHallRules';
import { syntheticVerifiedFixtureSource, unknownFixtureFact } from '../../test/fixtures/economyCatalog';

function fact(id: string, label: string, value: number, unit: CatalogFact['unit'] = 'items'): CatalogFact {
  return { id, label, value, unit, source: syntheticVerifiedFixtureSource };
}

function rules(): ReturnType<typeof createTownHallRules> {
  const levels: TownHallRule[] = [1, 2, 3, 4, 5].map((level) => ({
    level: level as 1 | 2 | 3 | 4 | 5,
    capacities: [
      { id: `field-${level}`, label: 'Synthetic field capacity', value: fact(`field-${level}`, 'Synthetic field capacity', level) },
      { id: `building-${level}`, label: 'Synthetic building capacity', value: fact(`building-${level}`, 'Synthetic building capacity', level) },
      { id: `animal-${level}`, label: 'Synthetic animal capacity', value: fact(`animal-${level}`, 'Synthetic animal capacity', level) },
    ],
    valueMultiplier: fact(`multiplier-${level}`, 'Synthetic value multiplier', 1, 'multiplier'),
  }));
  return createTownHallRules(levels);
}

describe('Town Hall rules', () => {
  it.each([1, 2, 3, 4, 5])('supports Town Hall level %i', (level) => {
    expect(validateTownHallLevel(level)).toBe(level);
    expect(getTownHallRule(rules(), level).level).toBe(level);
  });

  it.each([0, 6, 1.5, Number.NaN])('rejects invalid Town Hall level %p', (level) => {
    expect(() => validateTownHallLevel(level)).toThrow(TownHallLevelValidationError);
  });

  it('uses source-backed unlock facts to distinguish locked and eligible activities', () => {
    const unlock = fact('activity.unlock', 'Synthetic activity unlock', 3, 'Town Hall level');

    expect(evaluateTownHallActivityEligibility(2, unlock)).toMatchObject({ state: 'locked', requiredLevel: 3 });
    expect(evaluateTownHallActivityEligibility(3, unlock)).toMatchObject({ state: 'eligible', requiredLevel: 3 });
  });

  it('keeps unknown unlocks and multipliers as named evidence gaps instead of defaulting values', () => {
    const knownRules = rules();
    const unknownRules = createTownHallRules(knownRules.levels.map((rule) => rule.level === 2
      ? { ...rule, valueMultiplier: { ...unknownFixtureFact, id: 'town-hall.2.multiplier', label: 'Town Hall 2 value multiplier', unit: 'multiplier' } }
      : rule,
    ));

    expect(evaluateTownHallActivityEligibility(2, { ...unknownFixtureFact, id: 'activity.unlock', label: 'Activity unlock', unit: 'Town Hall level' }))
      .toEqual({
        state: 'incomplete',
        missingFacts: [{ factId: 'activity.unlock', factLabel: 'Activity unlock', source: unknownFixtureFact.source }],
      });
    expect(getTownHallValueMultiplier(unknownRules, 2)).toEqual({
      ok: false,
      missingFacts: [{
        factId: 'town-hall.2.multiplier',
        factLabel: 'Town Hall 2 value multiplier',
        source: unknownFixtureFact.source,
      }],
    });
  });

  it('exposes field, building, and animal capacity gaps for all evidence-pending levels', () => {
    for (const level of [1, 2, 3, 4, 5]) {
      expect(getTownHallCapacityEvidenceGaps(FARMING_SEASON_TOWN_HALL_RULES, level).map((gap) => gap.factId)).toEqual([
        `town-hall.${level}.field-capacity`,
        `town-hall.${level}.building-capacity`,
        `town-hall.${level}.animal-capacity`,
      ]);
    }
  });

  it('returns known capacity values together with their source-backed facts', () => {
    const result = getTownHallCapacities(rules(), 4);

    expect(result).toEqual({
      capacities: [
        { id: 'field-4', label: 'Synthetic field capacity', value: 4, fact: fact('field-4', 'Synthetic field capacity', 4) },
        { id: 'building-4', label: 'Synthetic building capacity', value: 4, fact: fact('building-4', 'Synthetic building capacity', 4) },
        { id: 'animal-4', label: 'Synthetic animal capacity', value: 4, fact: fact('animal-4', 'Synthetic animal capacity', 4) },
      ],
      missingFacts: [],
    });
  });
});
