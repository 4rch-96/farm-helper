import type { FarmSnapshot } from '../../domain/farm/FarmSnapshot';
import { isActivityUnlocked } from '../../domain/farm/FarmSnapshot';
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
    available.push({
      id: scenario.id,
      label: scenario.label,
      timeframe: scenario.timeframe,
      metrics,
      formulaInputs: scenario.input,
      assumptions: scenario.assumptions,
      limitations: ['Estimate only. Values are not guaranteed and are not financial advice.'],
    });
  }

  return Object.freeze({
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    scenarios: Object.freeze([...available].sort((left, right) => right.metrics.netProfit - left.metrics.netProfit)),
    unavailableScenarios: Object.freeze(unavailable),
    disclosures: Object.freeze([
      'Recommendations are read-only estimates based on provided inputs.',
      'Perform any game action manually in Farming Season.',
    ]),
  });
}
