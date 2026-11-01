import { describe, expect, it } from 'vitest';
import {
  FARMING_SEASON_GUIDE_REVIEWED_AT,
  FARMING_SEASON_GUIDE_URL,
  FarmingSeasonOfficialGuide,
} from './FarmingSeasonOfficialGuide';

describe('FarmingSeasonOfficialGuide', () => {
  const guide = new FarmingSeasonOfficialGuide().getGuide();

  it('records the five official Town Hall levels and their documented progression', () => {
    expect(guide.townHalls.map((level) => level.level)).toEqual([1, 2, 3, 4, 5]);
    expect(guide.townHalls.map((level) => level.maxFields.value)).toEqual([6, 12, 18, 24, 30]);
    expect(guide.townHalls.map((level) => level.produceValueMultiplier.value)).toEqual([1, 1.6, 1.75, 2.1, 2.4]);
    expect(guide.townHalls.map((level) => level.animalCapacityMultiplier.value)).toEqual([1, 1.25, 1.5, 1.75, 2]);
    expect(guide.townHalls.map((level) => level.dailyEarningLimitMultiplier.value)).toEqual([1, 2.3, 5.3, 12, 26.7]);
    expect(guide.townHalls[0]?.dailyEarningLimitUsd?.value).toBe(1.5);
  });

  it('captures energy, crop cycles, feed conversion, and animal care without assigning undocumented payouts', () => {
    expect(guide.freeDailyEnergy.value).toBe(100);
    expect(guide.energyActions.map((action) => action.energy.value)).toEqual([2, 2, 2, 2, 2, 5]);
    expect(guide.crops).toHaveLength(20);
    expect(guide.crops.find((crop) => crop.id === 'radish')?.growthHours.value).toBe(0.5);
    expect(guide.crops.find((crop) => crop.id === 'pumpkin')?.growthHours.value).toBe(24);
    expect(guide.crops.filter((crop) => crop.settlement === 'silo').map((crop) => crop.id)).toEqual(['wheat', 'corn']);
    expect(guide.feedRecipe.feedBagsProduced.value).toBe(10);
    expect(guide.animals.map((animal) => [animal.label, animal.productCadenceHours.value, animal.feedBagsPerMeal.value])).toEqual([
      ['Chicken', 24, 2], ['Sheep', 72, 5], ['Cow', 24, 8], ['Pig', 168, 10],
    ]);
  });

  it('captures source-backed collection, market, and fishing rules', () => {
    expect(guide.resourceActivities.map((activity) => [activity.id, activity.unlockLevel.value, activity.collectionCadenceHours.value])).toEqual([
      ['mine', 2, 6], ['oil-well', 3, 24],
    ]);
    expect(guide.playerMarket.sellerFeeRate.value).toBe(0.05);
    expect(guide.farmBank.sellerFeeRate.value).toBe(0.02);
    expect(guide.fishing.dailyCastLimit.value).toBe(20);
    expect(guide.fishing.catches.reduce((total, fish) => total + fish.probability.value, 0)).toBeCloseTo(1);
  });

  it('keeps every documented mechanic traceable to the official guide', () => {
    expect(guide.sourceUrl).toBe(FARMING_SEASON_GUIDE_URL);
    expect(guide.reviewedAt).toBe(FARMING_SEASON_GUIDE_REVIEWED_AT);
    expect(guide.townHalls[0]?.maxFields.source).toMatchObject({
      kind: 'official-guide',
      confidence: 'verified',
      observedAt: FARMING_SEASON_GUIDE_REVIEWED_AT,
      reference: expect.stringContaining(FARMING_SEASON_GUIDE_URL),
    });
    expect(guide.crops.every((crop) => crop.source.kind === 'official-guide')).toBe(true);
    expect(guide.animals.every((animal) => animal.source.kind === 'official-guide')).toBe(true);
  });
});
