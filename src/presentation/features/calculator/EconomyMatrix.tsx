import type {
  EconomyMatrix as EconomyMatrixResult,
  EconomyMatrixRow,
  EconomyMatrixSortMetric,
} from '../../../application/use-cases/BuildEconomyMatrix';
import type { TownHallLevel } from '../../../domain/economy/TownHallRules';

export type EconomyMatrixProps = Readonly<{
  matrix: EconomyMatrixResult;
  selectedActivityId?: string;
  onTownHallLevelChange: (level: TownHallLevel) => void;
  onSortMetricChange: (metric: EconomyMatrixSortMetric) => void;
  onActivitySelect?: (row: EconomyMatrixRow) => void;
}>;

const SORT_METRICS: ReadonlyArray<Readonly<{ value: EconomyMatrixSortMetric; label: string }>> = [
  { value: 'net-per-cycle', label: 'Net per cycle' },
  { value: 'net-per-hour', label: 'Net per hour' },
  { value: 'net-per-energy', label: 'Net per energy' },
];

function formatTokens(value: number | undefined): string {
  return value === undefined ? 'Not available' : `${value.toFixed(2)} tokens`;
}

function metricValue(row: EconomyMatrixRow, metric: EconomyMatrixSortMetric): number | undefined {
  if (row.state !== 'complete') return undefined;

  switch (metric) {
    case 'net-per-cycle':
      return row.metrics.netPerCycle;
    case 'net-per-hour':
      return row.metrics.netPerHour;
    case 'net-per-energy':
      return row.metrics.netPerEnergy;
  }
}

function statusText(row: EconomyMatrixRow): string {
  if (row.state === 'complete') return row.rank === undefined ? 'Complete, unranked' : `Complete, rank ${row.rank}`;
  if (row.state === 'locked') return `Locked until Town Hall ${row.requiredUnlockLevel ?? 'evidence is available'}`;
  return `Incomplete: ${row.missingFacts.length} evidence gap${row.missingFacts.length === 1 ? '' : 's'}`;
}

function rankingText(matrix: EconomyMatrixResult): string {
  if (matrix.ranking.status === 'available') {
    return `Ranking available for ${matrix.ranking.comparableActivityCount} complete activities.`;
  }

  return 'Ranking unavailable: fewer than two complete eligible activities have source-backed metrics.';
}

/**
 * Renders a source-aware matrix result. Calculation and ordering stay in the
 * application layer; this component only exposes the declared result and
 * forwards planner selections to its owner.
 */
export function EconomyMatrix({
  matrix,
  selectedActivityId,
  onTownHallLevelChange,
  onSortMetricChange,
  onActivitySelect,
}: EconomyMatrixProps) {
  const selectedMetricLabel = SORT_METRICS.find((metric) => metric.value === matrix.sortMetric)?.label ?? matrix.sortMetric;

  return <section className="economy-matrix" aria-labelledby="economy-matrix-title">
    <div className="economy-matrix__heading">
      <div>
        <p className="eyebrow">GLOBAL PLANNER</p>
        <h2 id="economy-matrix-title">Activity matrix</h2>
      </div>
      <p className="economy-matrix__ranking" role="status">{rankingText(matrix)}</p>
    </div>

    <div className="economy-matrix__controls">
      <label htmlFor="town-hall-level">Town Hall level
        <select
          id="town-hall-level"
          value={matrix.selectedTownHallLevel}
          onChange={(event) => onTownHallLevelChange(Number(event.target.value) as TownHallLevel)}
        >
          {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Town Hall {level}</option>)}
        </select>
      </label>
      <label htmlFor="economy-sort-metric">Sort metric
        <select
          id="economy-sort-metric"
          value={matrix.sortMetric}
          onChange={(event) => onSortMetricChange(event.target.value as EconomyMatrixSortMetric)}
        >
          {SORT_METRICS.map((metric) => <option key={metric.value} value={metric.value}>{metric.label}</option>)}
        </select>
      </label>
    </div>

    <p className="economy-matrix__sort-note">Rows are ordered by declared metric: <strong>{selectedMetricLabel}</strong>. Incomplete and locked activities are never ranked.</p>

    <div className="economy-matrix__table-wrap">
      <table>
        <caption>Global activities at Town Hall {matrix.selectedTownHallLevel}</caption>
        <thead>
          <tr><th scope="col">Activity</th><th scope="col">Status</th><th scope="col">{selectedMetricLabel}</th><th scope="col">Rank</th></tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => {
            const metric = metricValue(row, matrix.sortMetric);
            const selected = row.activityId === selectedActivityId;
            return <tr key={row.activityId} data-testid={`economy-row-${row.activityId}`} data-state={row.state}>
              <th scope="row">
                <button
                  type="button"
                  className="economy-matrix__activity"
                  aria-pressed={selected}
                  onClick={() => onActivitySelect?.(row)}
                >
                  {row.label}
                  <span className="economy-matrix__responsive-summary" data-responsive-summary="true">
                    {statusText(row)} · {formatTokens(metric)}
                  </span>
                </button>
              </th>
              <td>{statusText(row)}</td>
              <td>{formatTokens(metric)}</td>
              <td>{row.rank === undefined ? 'Unranked' : row.rank}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </section>;
}
