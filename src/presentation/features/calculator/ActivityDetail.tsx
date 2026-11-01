import type { EconomyMatrixRow } from '../../../application/use-cases/BuildEconomyMatrix';
import type { CatalogEvidenceGap, FactSource } from '../../../domain/economy/EconomyCatalog';

export type ActivityDetailProps = Readonly<{
  row?: EconomyMatrixRow;
}>;

function formatTokens(value: number | undefined): string {
  return value === undefined ? 'Not available' : `${value.toFixed(2)} tokens`;
}

function SourceRecord({ source }: Readonly<{ source: FactSource }>) {
  return <li>
    <strong>{source.kind}</strong>
    <code>{source.reference}</code>
    <span>Freshness: {source.observedAt} ({source.dateKind})</span>
    <span>Confidence: {source.confidence}</span>
  </li>;
}

function EvidenceGaps({ gaps }: Readonly<{ gaps: ReadonlyArray<CatalogEvidenceGap> }>) {
  if (gaps.length === 0) return <p>No named evidence gaps for this activity.</p>;

  return <ul className="activity-detail__gaps">
    {gaps.map((gap) => <li key={gap.factId}>
      <strong>{gap.factLabel}</strong> <code>{gap.factId}</code>
      <span>{gap.source.kind}: {gap.source.reference}</span>
      <span>Freshness: {gap.source.observedAt} ({gap.source.dateKind}); confidence: {gap.source.confidence}</span>
    </li>)}
  </ul>;
}

/** Displays auditable calculation evidence without inferring absent values. */
export function ActivityDetail({ row }: ActivityDetailProps) {
  if (row === undefined) {
    return <aside className="activity-detail" aria-label="Activity detail">
      <p className="eyebrow">ACTIVITY DETAIL</p>
      <p>Select an activity to inspect its source evidence and planning limits.</p>
    </aside>;
  }

  if (row.state !== 'complete' && row.state === 'locked') {
    return <aside className="activity-detail" aria-labelledby="activity-detail-title">
      <p className="eyebrow">ACTIVITY DETAIL</p>
      <h2 id="activity-detail-title">{row.label}</h2>
      <p>This activity is locked until Town Hall {row.requiredUnlockLevel ?? 'its documented unlock level'}.</p>
      <h3>Evidence gaps</h3>
      <EvidenceGaps gaps={row.missingFacts} />
    </aside>;
  }

  if (row.state !== 'complete') {
    return <aside className="activity-detail" aria-labelledby="activity-detail-title">
      <p className="eyebrow">ACTIVITY DETAIL</p>
      <h2 id="activity-detail-title">{row.label}</h2>
      <p className="activity-detail__status">Formula unavailable until every required fact has admissible evidence. This activity is not ranked.</p>
      <h3>Named evidence gaps</h3>
      <EvidenceGaps gaps={row.missingFacts} />
    </aside>;
  }

  const { activity } = row.formulaInputs;
  const { metrics } = row;

  return <aside className="activity-detail" aria-labelledby="activity-detail-title">
    <p className="eyebrow">ACTIVITY DETAIL</p>
    <h2 id="activity-detail-title">{row.label}</h2>
    <p className="activity-detail__status">Complete source-backed calculation{row.rank === undefined ? '; unranked for the selected metric.' : `; rank ${row.rank}.`}</p>

    <h3>Formula</h3>
    <code className="activity-detail__formula">net per cycle = gross value − seller fee − input opportunity cost − direct cost</code>
    <dl>
      <div><dt>Gross value</dt><dd>{formatTokens(metrics.grossValue)}</dd></div>
      <div><dt>Seller fee</dt><dd>−{formatTokens(metrics.feeAmount)}</dd></div>
      <div><dt>Input opportunity cost</dt><dd>−{formatTokens(metrics.inputOpportunityCost)}</dd></div>
      <div><dt>Direct cost</dt><dd>−{formatTokens(metrics.directCost)}</dd></div>
      <div><dt>Net per cycle</dt><dd>{formatTokens(metrics.netPerCycle)}</dd></div>
      <div><dt>Net per hour</dt><dd>{formatTokens(metrics.netPerHour)}</dd></div>
      <div><dt>Net per energy</dt><dd>{formatTokens(metrics.netPerEnergy)}</dd></div>
      <div><dt>Break-even output price</dt><dd>{formatTokens(metrics.breakEvenOutputUnitPrice)}</dd></div>
    </dl>

    <h3>Assumptions and constraints</h3>
    {activity.constraints.length === 0
      ? <p>No additional operational assumptions are recorded.</p>
      : <ul>{activity.constraints.map((constraint) => <li key={constraint.id}>{constraint.label}</li>)}</ul>}

    <h3>Limits and Town Hall capacity</h3>
    <ul>
      {activity.limits.map((limit) => <li key={limit.id}>{limit.label}: {String(limit.value)} {limit.unit}</li>)}
      {row.applicableTownHallCapacities.map((capacity) => <li key={capacity.id}>{capacity.label}: {capacity.value} {capacity.fact.unit}</li>)}
    </ul>

    <h3>Sources, freshness, and confidence</h3>
    <ul className="activity-detail__sources">
      {row.provenance.map((source) => <SourceRecord key={`${source.kind}-${source.reference}-${source.observedAt}`} source={source} />)}
    </ul>

    <h3>Named evidence gaps</h3>
    <EvidenceGaps gaps={row.missingFacts} />
  </aside>;
}
