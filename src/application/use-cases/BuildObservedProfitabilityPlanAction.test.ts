import { describe, expect, it } from 'vitest';
import { FarmingSeasonOfficialGuide } from '../../adapters/guide/FarmingSeasonOfficialGuide';
import { JsonLocalActionObservationImporter } from '../../adapters/import/JsonLocalActionObservationImporter';
import { JsonLocalGameCaptureImporter } from '../../adapters/import/JsonLocalGameCaptureImporter';
import { buildObservedProfitabilityPlan } from './BuildObservedProfitabilityPlan';

const BEFORE = 1_793_512_000_000;
const AFTER = BEFORE + 60_000;

function farmCapture(input: Readonly<{
  now: number;
  energy: number;
  wheat: number;
  fieldCount: number;
}>): string {
  return JSON.stringify({
    now: input.now,
    farm: {
      version: 2,
      level: 4,
      tokens: 100,
      today: { energy: input.energy },
      silo: { wheat: input.wheat, corn: 0, feed: 0 },
      fields: Array.from({ length: input.fieldCount }, () => ({ crop: 'wheat' })),
      animals: [],
      structures: [],
      log: [],
    },
  });
}

describe('buildObservedProfitabilityPlan action context', () => {
  it('surfaces a batch action that conflicts with the documented per-field energy rule without generalizing it', () => {
    const before = farmCapture({ now: BEFORE, energy: 72, wheat: 0, fieldCount: 24 });
    const after = farmCapture({ now: AFTER, energy: 68, wheat: 24, fieldCount: 0 });
    const action = new JsonLocalActionObservationImporter().import({
      before,
      after,
      receipt: JSON.stringify({ results: [{ ok: true, msg: 'Wheat is in your silo.', gained: 0 }] }),
    });
    const capture = new JsonLocalGameCaptureImporter().import(after);
    if (!action.ok || !capture.ok) throw new Error('Synthetic captures should import.');

    const plan = buildObservedProfitabilityPlan(
      new FarmingSeasonOfficialGuide().getGuide(),
      capture.capture,
      [action.observation],
    );

    expect(plan.actionObservations).toEqual([expect.objectContaining({
      kind: 'harvest-to-silo',
      scope: 'batch',
      item: 'wheat',
      quantity: 24,
      documentedEnergy: 48,
      observedEnergySpent: 4,
      energyComparison: 'differs',
      tokenDelta: 0,
      siloDeltas: { wheat: 24 },
      fieldDeltas: { wheat: -24 },
    })]);
    expect(plan.rows.find((row) => row.activityId === 'wheat')).toBeUndefined();
  });
});
