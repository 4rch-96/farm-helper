import type { FarmSnapshot } from '../../domain/farm/FarmSnapshot';
import { isActivityUnlocked, remainingDailyEarningCapacity } from '../../domain/farm/FarmSnapshot';
import { calculateProfitability, type ProfitabilityInput, type ProfitabilityMetrics } from '../../domain/profitability/ProfitabilityPolicy';

export type ScenarioDefinition = Readonly<{
  id: string;
  label: string;
  requiredLevel: number;
  timeframe: string;
  assumptions: ReadonlyArray<string>;
  input?: ProfitabilityInput;
  missingInputs?: ReadonlyArray<string>;
}>;

export type ScenarioRecommendation = Readonly<{
  id: string;
  label: string;
  timeframe: string;
  metrics: ProfitabilityMetrics;
  formulaInputs: ProfitabilityInput;
  assumptions: ReadonlyArray<string>;
  limitations: ReadonlyArray<string>;
  ranking: Readonly<{
    metric: 'effective-hourly-net-profit';
    value: number;
    effectiveNetProfit: number;
  }>;
}>;

export type UnavailableScenario = Readonly<{
  id: string;
  label: string;
  reason: string;
}>;

export type ProfitabilityAnalysis = Readonly<{
  generatedAt: string;
  scenarios: ReadonlyArray<ScenarioRecommendation>;
  unavailableScenarios: ReadonlyArray<UnavailableScenario>;
  disclosures: ReadonlyArray<string>;
}>;

export type ProfitabilityAnalysisInput = Readonly<{
  snapshot: FarmSnapshot;
  scenarios: ReadonlyArray<ScenarioDefinition>;
  generatedAt?: string;
}>;

export function analyzeFarmProfitability(input: ProfitabilityAnalysisInput): ProfitabilityAnalysis {
  const available: ScenarioRecommendation[] = [];
  const unavailable: UnavailableScenario[] = [];
  const dailyCapacity = remainingDailyEarningCapacity(input.snapshot);

  for (const scenario of input.scenarios) {
    if (!isActivityUnlocked(input.snapshot, scenario.requiredLevel)) {
      unavailable.push({
        id: scenario.id,
        label: scenario.label,
        reason: `Unlocks at Town Hall level ${scenario.requiredLevel}.`,
      });
      continue;
    }

    if (scenario.input === undefined || (scenario.missingInputs?.length ?? 0) > 0) {
      unavailable.push({
        id: scenario.id,
        label: scenario.label,
        reason: `Missing inputs: ${(scenario.missingInputs ?? ['scenario assumptions']).join(', ')}.`,
      });
      continue;
    }

    const metrics = calculateProfitability(scenario.input);
    if (dailyCapacity !== undefined && dailyCapacity <= 0) {
      unavailable.push({
        id: scenario.id,
        label: scenario.label,
        reason: 'Daily earning capacity has been reached for this farm.',
      });
      continue;
    }

    const effectiveNetProfit = dailyCapacity === undefined ? metrics.netProfit : Math.min(metrics.netProfit, dailyCapacity);
    const rankingValue = scenario.input.durationHours === 0 ? Number.NEGATIVE_INFINITY : effectiveNetProfit / scenario.input.durationHours;
    const limitations = ['Estimate only. Values are not guaranteed and are not financial advice.'];

    if (dailyCapacity === undefined) {
      limitations.push('Daily earning capacity is unavailable, so this estimate is not cap-adjusted.');
    } else if (metrics.netProfit > dailyCapacity) {
      limitations.push(`Daily earning capacity limits the effective estimate to ${dailyCapacity} tokens.`);
    }

    available.push({
      id: scenario.id,
      label: scenario.label,
      timeframe: scenario.timeframe,
      metrics,
      formulaInputs: scenario.input,
      assumptions: scenario.assumptions,
      limitations,
      ranking: {
        metric: 'effective-hourly-net-profit',
        value: rankingValue,
        effectiveNetProfit,
      },
    });
  }

  return Object.freeze({
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    scenarios: Object.freeze([...available].sort((left, right) => right.ranking.value - left.ranking.value)),
    unavailableScenarios: Object.freeze(unavailable),
    disclosures: Object.freeze([
      'Recommendations are read-only estimates based on provided inputs.',
      'Scenarios are ranked by effective hourly net profit; daily earning capacity is applied when available.',
      'Perform any game action manually in Farming Season.',
    ]),
  });
}
