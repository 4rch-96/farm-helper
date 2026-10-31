import { calculateNetSaleValue } from '../../domain/profitability/ProfitabilityPolicy';

export type MarketGuidanceInput = Readonly<{
  item: string;
  baselineValue?: number;
  sellerFeeRate?: number;
  targetMultiplier?: number;
  sourceTimestamp?: string;
}>;

export type MarketGuidance =
  | Readonly<{ available: false; item: string; reason: string; disclosures: ReadonlyArray<string> }>
  | Readonly<{
      available: true;
      item: string;
      grossTargetValue: number;
      feeRate: number;
      feeAmount: number;
      estimatedNetValue: number;
      sourceTimestamp?: string;
      disclosures: ReadonlyArray<string>;
    }>;

export function createMarketGuidance(input: MarketGuidanceInput): MarketGuidance {
  if (input.baselineValue === undefined || input.sellerFeeRate === undefined) {
    return Object.freeze({
      available: false,
      item: input.item,
      reason: 'A verified baseline value and seller fee are required for guidance.',
      disclosures: Object.freeze(['Live player-market liquidity is unavailable in this estimate.']),
    });
  }

  const grossTargetValue = input.baselineValue * (input.targetMultiplier ?? 1);
  const sale = calculateNetSaleValue({ grossValue: grossTargetValue, sellerFeeRate: input.sellerFeeRate });

  return Object.freeze({
    available: true,
    item: input.item,
    grossTargetValue,
    feeRate: input.sellerFeeRate,
    feeAmount: sale.feeAmount,
    estimatedNetValue: sale.netValue,
    ...(input.sourceTimestamp === undefined ? {} : { sourceTimestamp: input.sourceTimestamp }),
    disclosures: Object.freeze([
      'This is read-only guidance; list, buy, and sell manually in Farming Season.',
      'Live player-market liquidity is not included in this estimate.',
    ]),
  });
}
