import { describe, expect, it } from 'vitest';
import { analyzeFarmProfitability } from '../application/use-cases/AnalyzeFarmProfitability';
import { createMarketGuidance } from '../application/use-cases/CreateMarketGuidance';
import { JsonFarmSnapshotImporter } from './import/JsonFarmSnapshotImporter';
import { FarmingSeasonPublicContextClient } from './http/FarmingSeasonPublicContextClient';

describe('safe data adapters', () => {
  it('feeds local snapshot analysis while public context remains optional', async () => {
    const imported = new JsonFarmSnapshotImporter().import(JSON.stringify({
      farm: {
        version: 2,
        level: 2,
        today: { energy: 90 },
        silo: { wheat: 5, corn: 5, feed: 20 },
        goods: { oil: 2 },
        animals: [{ kind: 'cow', productReady: true }],
      },
    }));
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    const analysis = analyzeFarmProfitability({
      snapshot: imported.snapshot,
      scenarios: [{ id: 'milk', label: 'Milk', requiredLevel: 2, timeframe: '24h', assumptions: [], input: { grossValue: 20, directCost: 5, durationHours: 24, energyCost: 2 } }],
    });
    const unavailableContext = await new FarmingSeasonPublicContextClient({ fetcher: async () => new Response('', { status: 503 }) }).getContext();
    const guidance = createMarketGuidance({ item: 'oil', baselineValue: 10, sellerFeeRate: 0.05 });

    expect(analysis.scenarios).toHaveLength(1);
    expect(unavailableContext).toMatchObject({ ok: false });
    expect(guidance).toMatchObject({ available: true });
    expect(guidance.disclosures.join(' ')).toContain('Live player-market liquidity is not included');
  });
});
