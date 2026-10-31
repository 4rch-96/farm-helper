import { describe, expect, it } from 'vitest';
import { calculateNetSaleValue, calculateProfitability, ProfitabilityValidationError } from './ProfitabilityPolicy';

describe('ProfitabilityPolicy', () => {
  it('calculates documented seller fee and net sale value', () => {
    expect(calculateNetSaleValue({ grossValue: 100, sellerFeeRate: 0.05 })).toEqual({
      grossValue: 100,
      feeAmount: 5,
      netValue: 95,
    });
  });

  it('calculates transparent ROI, energy efficiency, and payback', () => {
    const result = calculateProfitability({ grossValue: 200, directCost: 80, durationHours: 4, energyCost: 10, sellerFeeRate: 0.05 });

    expect(result.netProfit).toBe(110);
    expect(result.roi).toBe(1.375);
    expect(result.energyEfficiency).toBe(11);
    expect(result.hourlyProfit).toBe(27.5);
    expect(result.paybackHours).toBeCloseTo(2.9091, 4);
  });

  it('does not invent ratios when required denominators are zero', () => {
    const result = calculateProfitability({ grossValue: 100, directCost: 0, durationHours: 0, energyCost: 0 });

    expect(result.roi).toBeUndefined();
    expect(result.energyEfficiency).toBeUndefined();
    expect(result.hourlyProfit).toBeUndefined();
  });

  it('does not report payback for a non-profitable scenario', () => {
    const result = calculateProfitability({ grossValue: 50, directCost: 60, durationHours: 4, energyCost: 2 });

    expect(result.netProfit).toBe(-10);
    expect(result.paybackHours).toBeUndefined();
  });

  it('rejects invalid costs and fees', () => {
    expect(() => calculateNetSaleValue({ grossValue: 100, sellerFeeRate: 1.2 })).toThrow(ProfitabilityValidationError);
  });
});
