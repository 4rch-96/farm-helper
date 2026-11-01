import type { EconomyCatalogProvider } from '../ports/EconomyCatalogProvider';
import {
  calculateEconomy,
  type EconomyFormulaInputs,
  type EconomyMetrics,
} from '../../domain/economy/EconomyCalculator';
import type { CatalogEvidenceGap, CatalogFact, FactSource } from '../../domain/economy/EconomyCatalog';
import {
  evaluateTownHallActivityEligibility,
  getTownHallCapacities,
  getTownHallValueMultiplier,
  validateTownHallLevel,
  type ApplicableTownHallCapacity,
  type TownHallLevel,
  type TownHallRules,
} from '../../domain/economy/TownHallRules';

export type EconomyMatrixSortMetric = 'net-per-cycle' | 'net-per-hour' | 'net-per-energy';

export type EconomyMatrixRanking =
  | Readonly<{ status: 'available'; comparableActivityCount: number }>
  | Readonly<{
    status: 'unavailable';
    comparableActivityCount: number;
    reason: 'fewer-than-two-complete-eligible-activities';
  }>;

export type EconomyMatrixRow =
  | Readonly<{
    activityId: string;
    label: string;
    state: 'complete';
    missingFacts: ReadonlyArray<never>;
    metrics: EconomyMetrics;
    formulaInputs: EconomyFormulaInputs;
    provenance: ReadonlyArray<FactSource>;
    applicableTownHallCapacities: ReadonlyArray<ApplicableTownHallCapacity>;
    requiredUnlockLevel: TownHallLevel;
    rank: number | undefined;
  }>
  | Readonly<{
    activityId: string;
    label: string;
    state: 'incomplete' | 'locked';
    missingFacts: ReadonlyArray<CatalogEvidenceGap>;
    applicableTownHallCapacities: ReadonlyArray<ApplicableTownHallCapacity>;
    requiredUnlockLevel?: TownHallLevel;
    rank: undefined;
  }>;

export type EconomyMatrix = Readonly<{
  selectedTownHallLevel: TownHallLevel;
  sortMetric: EconomyMatrixSortMetric;
  ranking: EconomyMatrixRanking;
  rows: ReadonlyArray<EconomyMatrixRow>;
}>;

export type BuildEconomyMatrixInput = Readonly<{
  catalogProvider: EconomyCatalogProvider;
  townHallRules: TownHallRules;
  sellerFeeRate: CatalogFact;
  selectedTownHallLevel: number;
  sortMetric?: EconomyMatrixSortMetric;
}>;

function metricValue(metrics: EconomyMetrics, metric: EconomyMatrixSortMetric): number {
  switch (metric) {
    case 'net-per-cycle':
      return metrics.netPerCycle;
    case 'net-per-hour':
      return metrics.netPerHour ?? Number.NEGATIVE_INFINITY;
    case 'net-per-energy':
      return metrics.netPerEnergy ?? Number.NEGATIVE_INFINITY;
  }
}

type CompleteEconomyMatrixRow = Extract<EconomyMatrixRow, { state: 'complete' }>;

function getRankableCompleteRow(
  row: EconomyMatrixRow,
  metric: EconomyMatrixSortMetric,
): CompleteEconomyMatrixRow | undefined {
  return row.state === 'complete' && Number.isFinite(metricValue(row.metrics, metric)) ? row : undefined;
}

function compareRows(metric: EconomyMatrixSortMetric) {
  return (left: EconomyMatrixRow, right: EconomyMatrixRow): number => {
    const rankableLeft = getRankableCompleteRow(left, metric);
    const rankableRight = getRankableCompleteRow(right, metric);
    if (rankableLeft !== undefined && rankableRight !== undefined) {
      const difference = metricValue(rankableRight.metrics, metric) - metricValue(rankableLeft.metrics, metric);
      return difference === 0 ? left.activityId.localeCompare(right.activityId) : difference;
    }
    if (rankableLeft !== undefined) {
      return -1;
    }
    if (rankableRight !== undefined) {
      return 1;
    }
    if (left.state === 'complete' && right.state !== 'complete') {
      return -1;
    }
    if (right.state === 'complete' && left.state !== 'complete') {
      return 1;
    }
    if (left.state !== right.state) {
      return left.state === 'incomplete' ? -1 : 1;
    }
    return left.activityId.localeCompare(right.activityId);
  };
}

/**
 * Builds a global, source-aware matrix. Farm snapshots and public-market data
 * are intentionally absent from its required input: later callers may overlay
 * them without making either personal-data source a prerequisite.
 */
export function buildEconomyMatrix(input: BuildEconomyMatrixInput): EconomyMatrix {
  const selectedTownHallLevel = validateTownHallLevel(input.selectedTownHallLevel);
  const sortMetric = input.sortMetric ?? 'net-per-cycle';
  const catalog = input.catalogProvider.getCatalog();
  const multiplier = getTownHallValueMultiplier(input.townHallRules, selectedTownHallLevel);
  const capacities = getTownHallCapacities(input.townHallRules, selectedTownHallLevel);

  const unsortedRows: EconomyMatrixRow[] = catalog.activities.map((activity) => {
    const eligibility = evaluateTownHallActivityEligibility(selectedTownHallLevel, activity.unlockLevel);
    if (eligibility.state === 'locked') {
      return Object.freeze({
        activityId: activity.id,
        label: activity.label,
        state: 'locked',
        missingFacts: Object.freeze([]),
        applicableTownHallCapacities: capacities.capacities,
        requiredUnlockLevel: eligibility.requiredLevel,
        rank: undefined,
      });
    }

    const calculation = calculateEconomy({
      activity,
      valueMultiplier: multiplier.ok ? multiplier.fact : input.townHallRules.levels[selectedTownHallLevel - 1].valueMultiplier,
      sellerFeeRate: input.sellerFeeRate,
      additionalEvidenceGaps: [
        ...capacities.missingFacts,
        ...(eligibility.state === 'incomplete' ? eligibility.missingFacts : []),
        ...(multiplier.ok ? [] : multiplier.missingFacts),
      ],
      applicableTownHallCapacities: capacities.capacities.map((capacity) => capacity.fact),
    });
    if (eligibility.state === 'incomplete' || calculation.state === 'incomplete') {
      return Object.freeze({
        activityId: activity.id,
        label: activity.label,
        state: 'incomplete',
        missingFacts: calculation.missingFacts,
        applicableTownHallCapacities: capacities.capacities,
        rank: undefined,
      });
    }

    return Object.freeze({
      activityId: activity.id,
      label: activity.label,
      state: 'complete',
      missingFacts: Object.freeze([]),
      metrics: calculation.metrics,
      formulaInputs: calculation.formulaInputs,
      provenance: calculation.provenance,
      applicableTownHallCapacities: capacities.capacities,
      requiredUnlockLevel: eligibility.requiredLevel,
      rank: 0,
    });
  });

  const comparableActivityCount = unsortedRows.filter((row) => getRankableCompleteRow(row, sortMetric) !== undefined).length;
  const ranking: EconomyMatrixRanking = comparableActivityCount >= 2
    ? Object.freeze({ status: 'available', comparableActivityCount })
    : Object.freeze({
      status: 'unavailable',
      comparableActivityCount,
      reason: 'fewer-than-two-complete-eligible-activities',
    });
  let rank = 0;
  const sortedRows = unsortedRows.sort(compareRows(sortMetric)).map((row) => {
    const rankableRow = getRankableCompleteRow(row, sortMetric);
    if (rankableRow === undefined) {
      return row.state === 'complete' ? Object.freeze({ ...row, rank: undefined }) : row;
    }
    if (ranking.status !== 'available') {
      return Object.freeze({ ...rankableRow, rank: undefined });
    }
    return Object.freeze({ ...rankableRow, rank: rank += 1 });
  });

  return Object.freeze({ selectedTownHallLevel, sortMetric, ranking, rows: Object.freeze(sortedRows) });
}
