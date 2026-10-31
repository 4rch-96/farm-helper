export type SaleEstimateInput = Readonly<{
  grossValue: number;
  sellerFeeRate: number;
}>;

export type ProfitabilityInput = Readonly<{
  grossValue: number;
  directCost: number;
  durationHours: number;
  energyCost: number;
  sellerFeeRate?: number;
}>;

export type ProfitabilityMetrics = Readonly<{
  grossValue: number;
  netValue: number;
  feeAmount: number;
  totalCost: number;
  netProfit: number;
  roi: number | undefined;
  energyEfficiency: number | undefined;
  hourlyProfit: number | undefined;
  paybackHours: number | undefined;
}>;

export class ProfitabilityValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ProfitabilityValidationError';
  }
}

function nonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new ProfitabilityValidationError(`${label} must be a non-negative finite number.`);
  }

  return value;
}

function rate(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ProfitabilityValidationError(`${label} must be between 0 and 1.`);
  }

  return value;
}

function roundTokenAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000;
}

export function calculateNetSaleValue(input: SaleEstimateInput): Readonly<{ grossValue: number; feeAmount: number; netValue: number }> {
  const grossValue = nonNegative(input.grossValue, 'Gross value');
  const sellerFeeRate = rate(input.sellerFeeRate, 'Seller fee rate');
  const feeAmount = roundTokenAmount(grossValue * sellerFeeRate);

  return Object.freeze({ grossValue, feeAmount, netValue: roundTokenAmount(grossValue - feeAmount) });
}

export function calculateProfitability(input: ProfitabilityInput): ProfitabilityMetrics {
  const grossValue = nonNegative(input.grossValue, 'Gross value');
  const directCost = nonNegative(input.directCost, 'Direct cost');
  const durationHours = nonNegative(input.durationHours, 'Duration hours');
  const energyCost = nonNegative(input.energyCost, 'Energy cost');
  const sellerFeeRate = input.sellerFeeRate === undefined ? 0 : rate(input.sellerFeeRate, 'Seller fee rate');
  const sale = calculateNetSaleValue({ grossValue, sellerFeeRate });
  const totalCost = directCost;
  const netProfit = sale.netValue - totalCost;

  return Object.freeze({
    grossValue,
    netValue: sale.netValue,
    feeAmount: sale.feeAmount,
    totalCost,
    netProfit,
    roi: totalCost === 0 ? undefined : netProfit / totalCost,
    energyEfficiency: energyCost === 0 ? undefined : netProfit / energyCost,
    hourlyProfit: durationHours === 0 ? undefined : netProfit / durationHours,
    paybackHours: sale.netValue <= 0 || durationHours === 0 ? undefined : (totalCost / sale.netValue) * durationHours,
  });
}
