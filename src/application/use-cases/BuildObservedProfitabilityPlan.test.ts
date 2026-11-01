import { describe, expect, it } from 'vitest';
import { FarmingSeasonOfficialGuide } from '../../adapters/guide/FarmingSeasonOfficialGuide';
import { JsonLocalGameCaptureImporter } from '../../adapters/import/JsonLocalGameCaptureImporter';
import { createLocalGameCapture, type ObservedValueUnit } from '../../domain/observations/LocalGameCapture';
import { buildObservedProfitabilityPlan, cropSeedCostKey } from './BuildObservedProfitabilityPlan';

const CAPTURE_TIME = 1_793_491_200_000;
const CAPTURED_AT = new Date(CAPTURE_TIME).toISOString();

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

function observedValue(value: number, unit: ObservedValueUnit = 'game-token') {
  return {
    value,
    unit,
    capturedAt: CAPTURED_AT,
    source: {
      kind: 'captured-game-ui' as const,
      reference: 'Test player-provided local capture',
      observedAt: CAPTURED_AT.slice(0, 10),
      dateKind: 'observed' as const,
      confidence: 'captured' as const,
    },
  };
}

function cropCapture(unit: ObservedValueUnit = 'game-token') {
  return createLocalGameCapture({
    farm: {
      capturedAt: CAPTURED_AT,
      townHallLevel: 1,
      energy: 100,
      animalCounts: {},
      buildingCounts: {},
    },
    directPayouts: { radish: observedValue(10) },
    directUnitCosts: { [cropSeedCostKey('radish')]: observedValue(3, unit) },
  });
}

describe('buildObservedProfitabilityPlan', () => {
  it('ranks complete animal margins and exposes their derived metrics and evidence', () => {
    const plan = planFrom(captureWithObservedAnimalEconomics());
    const cow = plan.rows.find((row) => row.activityId === 'cow');
    const chicken = plan.rows.find((row) => row.activityId === 'chicken');

    expect(plan.ranking).toEqual({ status: 'available', metric: 'benefit-per-energy', completeActivityCount: 2 });
    expect(cow).toEqual(expect.objectContaining({
      state: 'complete',
      rank: 1,
      resultStatus: 'derived',
      metrics: expect.objectContaining({ grossValue: 327, directCost: 96, feeAmount: 0, netBenefit: 231, roi: 2.40625, benefitPerHour: 9.625, energyPerCycle: 6, benefitPerEnergy: 38.5 }),
    }));
    expect(cow?.evidence.map((fact) => fact.status)).toEqual(expect.arrayContaining(['official', 'observed']));
    expect(chicken).toEqual(expect.objectContaining({
      state: 'complete',
      rank: 2,
      metrics: expect.objectContaining({ grossValue: 162, directCost: 48, netBenefit: 114, benefitPerEnergy: 19 }),
    }));
    expect(plan.feeContext).toEqual({ playerMarketSellerFeeRate: 0.05, farmBankSellerFeeRate: 0.02 });
  });

  it('calculates a crop only when payout and seed cost are compatible observed game-token values', () => {
    const plan = buildObservedProfitabilityPlan(new FarmingSeasonOfficialGuide().getGuide(), cropCapture());
    const radish = plan.rows.find((row) => row.activityId === 'radish');

    expect(radish).toEqual(expect.objectContaining({
      state: 'complete',
      category: 'crop',
      resultStatus: 'derived',
      metrics: expect.objectContaining({
        grossValue: 10,
        directCost: 3,
        netBenefit: 7,
        roi: 7 / 3,
        benefitPerHour: 14,
        energyPerCycle: 4,
        benefitPerEnergy: 1.75,
      }),
    }));
    expect(radish?.evidence.map((fact) => fact.status)).toEqual(expect.arrayContaining(['official', 'observed']));
    expect(plan.ranking).toEqual({ status: 'unavailable', metric: 'benefit-per-energy', completeActivityCount: 1 });
  });

  it('keeps a crop unranked when an observed value has no compatible token unit', () => {
    const plan = buildObservedProfitabilityPlan(new FarmingSeasonOfficialGuide().getGuide(), cropCapture('unknown'));
    const radish = plan.rows.find((row) => row.activityId === 'radish');

    expect(radish).toEqual(expect.objectContaining({
      state: 'incomplete',
      category: 'crop',
      missing: ['compatible in-game token units'],
      rank: undefined,
    }));
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
    expect(chili?.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'chili.duration', status: 'official' }),
      expect.objectContaining({ id: 'chili.payout', status: 'observed' }),
      expect.objectContaining({ label: 'captured seed cost', status: 'unknown' }),
    ]));
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
    expect(plan.ranking).toEqual({ status: 'unavailable', metric: 'benefit-per-energy', completeActivityCount: 0 });
    expect(chicken).toEqual(expect.objectContaining({
      state: 'incomplete',
      missing: expect.arrayContaining(['direct-game payout for egg', 'captured feed unit cost']),
      rank: undefined,
    }));
  });
});
