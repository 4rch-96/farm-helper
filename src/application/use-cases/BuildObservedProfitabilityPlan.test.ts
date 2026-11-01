import { describe, expect, it } from 'vitest';
import { FarmingSeasonOfficialGuide } from '../../adapters/guide/FarmingSeasonOfficialGuide';
import { JsonLocalGameCaptureImporter } from '../../adapters/import/JsonLocalGameCaptureImporter';
import { buildObservedProfitabilityPlan } from './BuildObservedProfitabilityPlan';

const CAPTURE_TIME = 1_793_491_200_000;

function captureWithObservedAnimalEconomics(): string {
  return JSON.stringify({
    now: CAPTURE_TIME,
    farm: {
      version: 2,
      level: 4,
      today: { energy: 100 },
      animals: [
        ...Array.from({ length: 6 }, () => ({ kind: 'chicken' })),
        ...Array.from({ length: 3 }, () => ({ kind: 'cow' })),
      ],
      structures: [{ kind: 'coop' }, { kind: 'barn' }],
      log: [
        { text: 'Collected egg (+27 SEASON)' },
        { text: 'Collected milk (+109 SEASON)' },
        { text: 'Field 2: harvested chili (+18 SEASON)' },
        { text: 'Market: bought 20 feed bags from Any Player (−40 SEASON)' },
      ],
    },
    listings: [
      { item: 'egg', qty: 20, price: 18 },
      { item: 'egg', qty: 5, price: 22 },
      { item: 'bread', qty: 2, price: 6 },
    ],
  });
}

function planFrom(raw: string) {
  const imported = new JsonLocalGameCaptureImporter().import(raw);
  if (!imported.ok) throw new Error(imported.message);
  return buildObservedProfitabilityPlan(new FarmingSeasonOfficialGuide().getGuide(), imported.capture);
}

describe('buildObservedProfitabilityPlan', () => {
  it('ranks only complete direct-game animal operating margins', () => {
    const plan = planFrom(captureWithObservedAnimalEconomics());
    const cow = plan.rows.find((row) => row.activityId === 'cow');
    const chicken = plan.rows.find((row) => row.activityId === 'chicken');

    expect(plan.ranking).toEqual({ status: 'available', completeActivityCount: 2 });
    expect(cow).toEqual(expect.objectContaining({
      state: 'complete',
      rank: 1,
      saleRoute: 'direct-game-payout',
      animalCount: 3,
      buildingCount: 1,
      metrics: expect.objectContaining({ grossValue: 327, feedCost: 96, feeAmount: 0, netPerCycle: 231, netPerHour: 9.625, energyPerCycle: 6, netPerEnergy: 38.5 }),
    }));
    expect(chicken).toEqual(expect.objectContaining({
      state: 'complete',
      rank: 2,
      metrics: expect.objectContaining({ grossValue: 162, feedCost: 48, netPerCycle: 114, netPerEnergy: 19 }),
    }));
    expect(plan.feeContext).toEqual({ playerMarketSellerFeeRate: 0.05, farmBankSellerFeeRate: 0.02 });
  });

  it('keeps crops and recipes incomplete when their required observed inputs are absent', () => {
    const plan = planFrom(captureWithObservedAnimalEconomics());
    const chili = plan.rows.find((row) => row.activityId === 'chili');
    const bread = plan.rows.find((row) => row.activityId === 'bread');

    expect(chili).toEqual(expect.objectContaining({
      state: 'incomplete',
      category: 'crop',
      missing: ['captured seed cost'],
      rank: undefined,
    }));
    expect(bread).toEqual(expect.objectContaining({
      state: 'incomplete',
      category: 'recipe',
      missing: expect.arrayContaining(['recipe inputs and quantities', 'recipe duration', 'unit-compatible output payout']),
      rank: undefined,
    }));
  });

  it('does not turn unit-unvalidated market asks into profitability data', () => {
    const plan = planFrom(JSON.stringify({
      now: CAPTURE_TIME,
      farm: {
        version: 2,
        level: 1,
        today: { energy: 100 },
        animals: [{ kind: 'chicken' }],
        structures: [{ kind: 'coop' }],
        log: [],
      },
      listings: [
        { item: 'egg', qty: 5, price: 99 },
        { item: 'feed', qty: 10, price: 1 },
      ],
    }));
    const chicken = plan.rows.find((row) => row.activityId === 'chicken');

    expect(plan.marketPriceUnitState).toBe('unit-validation-pending');
    expect(plan.ranking).toEqual({ status: 'unavailable', completeActivityCount: 0 });
    expect(chicken).toEqual(expect.objectContaining({
      state: 'incomplete',
      missing: expect.arrayContaining(['direct-game payout for egg', 'captured feed unit cost']),
      rank: undefined,
    }));
  });
});
