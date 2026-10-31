import { describe, expect, it } from 'vitest';
import { createFarmSnapshot } from '../../domain/farm/FarmSnapshot';
import { supportedFarmSnapshot } from '../../test/fixtures/farmSnapshot';
import { analyzeFarmProfitability } from './AnalyzeFarmProfitability';
import { createMarketGuidance } from './CreateMarketGuidance';

describe('profitability use cases', () => {
  it('ranks eligible scenarios and explains unavailable ones', () => {
    const analysis = analyzeFarmProfitability({
      snapshot: createFarmSnapshot(supportedFarmSnapshot),
      generatedAt: '2026-10-30T12:00:00.000Z',
      scenarios: [
        { id: 'barn', label: 'Barn expansion', requiredLevel: 5, timeframe: '12h', assumptions: [], input: { grossValue: 200, directCost: 80, durationHours: 12, energyCost: 2 } },
        { id: 'milk', label: 'Milk', requiredLevel: 2, timeframe: '24h', assumptions: ['Stable demand'], input: { grossValue: 120, directCost: 20, durationHours: 24, energyCost: 2, sellerFeeRate: 0.05 } },
        { id: 'unknown', label: 'Unknown recipe', requiredLevel: 1, timeframe: '1h', assumptions: [], missingInputs: ['output value'] },
      ],
    });

    expect(analysis.scenarios).toHaveLength(1);
    expect(analysis.scenarios[0]?.id).toBe('milk');
    expect(analysis.unavailableScenarios.map((scenario) => scenario.id)).toEqual(['barn', 'unknown']);
    expect(analysis.disclosures.join(' ')).toContain('manually');
  });

  it('returns fee-aware guidance without game actions', () => {
    const guidance = createMarketGuidance({ item: 'oil', baselineValue: 10, sellerFeeRate: 0.05, targetMultiplier: 1.2 });

    expect(guidance).toMatchObject({ available: true, grossTargetValue: 12, feeAmount: 0.6, estimatedNetValue: 11.4 });
  });

  it('marks guidance unavailable when fee inputs are unknown', () => {
    expect(createMarketGuidance({ item: 'oil', baselineValue: 10 })).toMatchObject({ available: false });
  });
});
