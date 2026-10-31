import { describe, expect, it } from 'vitest';
import { getActivityFacts, getActivityEvidenceGaps, hasCompleteActivityEconomics } from '../../domain/economy/EconomyCatalog';
import { CATALOG_REVIEWED_AT, FarmingSeasonDocumentationCatalog } from './FarmingSeasonDocumentationCatalog';

const expectedCategories = ['animal', 'crop', 'feed', 'fishing', 'mine', 'oil', 'processing'];

describe('FarmingSeasonDocumentationCatalog', () => {
  it('covers every supported activity category with a versioned, immutable catalog', () => {
    const catalog = new FarmingSeasonDocumentationCatalog().getCatalog();

    expect(catalog.version).toBe('farming-season-documentation-catalog-2026-10-31');
    expect(catalog.reviewedAt).toBe(CATALOG_REVIEWED_AT);
    expect([...catalog.activities.map((activity) => activity.category)].sort()).toEqual(expectedCategories);
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog.activities)).toBe(true);
    expect(catalog.activities.every(Object.isFrozen)).toBe(true);
  });

  it('preserves source identity, catalog-review date, and unknown confidence for unpublished facts', () => {
    const catalog = new FarmingSeasonDocumentationCatalog().getCatalog();

    for (const activity of catalog.activities) {
      for (const fact of getActivityFacts(activity)) {
        expect(fact.value).toBe('unknown');
        expect(fact.source).toEqual({
          kind: 'unknown',
          reference: 'Catalog review: no admissible Farming Season source is recorded for this fact.',
          observedAt: CATALOG_REVIEWED_AT,
          dateKind: 'catalog-review',
          confidence: 'unknown',
        });
      }
      expect(activity.constraints).toEqual([
        {
          id: `${activity.id}.constraints`,
          label: 'Operational constraints',
          source: {
            kind: 'unknown',
            reference: 'Catalog review: no admissible Farming Season source is recorded for this fact.',
            observedAt: CATALOG_REVIEWED_AT,
            dateKind: 'catalog-review',
            confidence: 'unknown',
          },
        },
      ]);
    }
  });

  it('keeps every pending activity incomplete with named evidence gaps instead of a definitive economy', () => {
    const catalog = new FarmingSeasonDocumentationCatalog().getCatalog();

    for (const activity of catalog.activities) {
      expect(hasCompleteActivityEconomics(activity)).toBe(false);
      expect(getActivityEvidenceGaps(activity).map((gap) => gap.factId)).toContain(`${activity.id}.output.sell-value`);
      expect(getActivityEvidenceGaps(activity).map((gap) => gap.factId)).toContain(`${activity.id}.additional-cost`);
    }
  });
});
