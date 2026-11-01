import type { ProductionChainComparisonResult } from "../../../application/use-cases/CompareProductionChain";
import type {
  CatalogEvidenceGap,
  FactSource,
} from "../../../domain/economy/EconomyCatalog";

export type ProductionChainComparisonProps = Readonly<{
  result?: ProductionChainComparisonResult;
}>;

function tokens(value: number): string {
  return `${value.toFixed(2)} tokens`;
}

function SourceList({
  sources,
}: Readonly<{ sources: ReadonlyArray<FactSource> }>) {
  return (
    <ul className="chain-comparison__sources">
      {sources.map((source) => (
        <li key={`${source.kind}-${source.reference}-${source.observedAt}`}>
          <strong>{source.kind}</strong>
          <code>{source.reference}</code>
          <span>
            Freshness: {source.observedAt} ({source.dateKind})
          </span>
          <span>Confidence: {source.confidence}</span>
        </li>
      ))}
    </ul>
  );
}

function EvidenceGaps({
  gaps,
}: Readonly<{ gaps: ReadonlyArray<CatalogEvidenceGap> }>) {
  return (
    <ul className="chain-comparison__gaps">
      {gaps.map((gap) => (
        <li key={gap.factId}>
          <strong>{gap.factLabel}</strong> <code>{gap.factId}</code>
          <span>
            {gap.source.kind}: {gap.source.reference}
          </span>
          <span>
            Freshness: {gap.source.observedAt} ({gap.source.dateKind});
            confidence: {gap.source.confidence}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Presents a comparison result already evaluated by the framework-independent
 * application layer. It never assembles a chain or infers missing economics.
 */
export function ProductionChainComparison({
  result,
}: ProductionChainComparisonProps) {
  if (result === undefined) {
    return (
      <section
        className="chain-comparison"
        aria-labelledby="chain-comparison-title"
      >
        <p className="eyebrow">PRODUCTION CHAINS</p>
        <h2 id="chain-comparison-title">Direct sale versus production</h2>
        <p>
          No source-backed production-chain comparison is available yet. The
          planner will not fill missing recipes, prices, or feeding data with
          estimates.
        </p>
      </section>
    );
  }

  if (result.state === "unavailable") {
    return (
      <section
        className="chain-comparison"
        aria-labelledby="chain-comparison-title"
      >
        <p className="eyebrow">PRODUCTION CHAINS</p>
        <h2 id="chain-comparison-title">Direct sale versus production</h2>
        <p>
          This production chain is unavailable until Town Hall{" "}
          {result.requiredTownHallLevel}.
        </p>
        <p>
          Unavailable activities: {result.unavailableActivities.join(", ")}.
        </p>
      </section>
    );
  }

  if (result.comparison.state === "incomplete") {
    return (
      <section
        className="chain-comparison"
        aria-labelledby="chain-comparison-title"
      >
        <p className="eyebrow">PRODUCTION CHAINS</p>
        <h2 id="chain-comparison-title">Direct sale versus production</h2>
        <p>
          Comparison unavailable until every required source fact is evidenced.
        </p>
        <h3>Named evidence gaps</h3>
        <EvidenceGaps gaps={result.comparison.missingFacts} />
      </section>
    );
  }

  const { comparison } = result;
  const { metrics } = comparison;

  return (
    <section
      className="chain-comparison"
      aria-labelledby="chain-comparison-title"
    >
      <p className="eyebrow">PRODUCTION CHAINS</p>
      <h2 id="chain-comparison-title">Direct sale versus production</h2>
      <div className="chain-comparison__metrics">
        <dl>
          <div>
            <dt>Direct-sale net</dt>
            <dd>{tokens(metrics.directSaleNet)}</dd>
          </div>
          <div>
            <dt>Production-chain net</dt>
            <dd>{tokens(metrics.transformedNet)}</dd>
          </div>
          <div>
            <dt>Net difference</dt>
            <dd>{tokens(metrics.netDifference)}</dd>
          </div>
        </dl>
        <dl>
          <div>
            <dt>Additional time</dt>
            <dd>{metrics.accumulatedTimeHours.toFixed(2)} hours</dd>
          </div>
          <div>
            <dt>Energy</dt>
            <dd>{metrics.accumulatedEnergy.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Direct cost</dt>
            <dd>{tokens(metrics.directCost)}</dd>
          </div>
        </dl>
      </div>

      {comparison.constraints.length > 0 && (
        <>
          <h3>Operational constraints</h3>
          <ul>
            {comparison.constraints.map((constraint) => (
              <li key={constraint.id}>{constraint.label}</li>
            ))}
          </ul>
        </>
      )}

      {comparison.warnings.length > 0 && (
        <>
          <h3>Feeding warnings</h3>
          <ul className="chain-comparison__warnings">
            {comparison.warnings.map((warning) => (
              <li key={warning.code} data-warning={warning.code}>
                <strong>
                  {warning.code === "feed-cadence"
                    ? "Feed cadence"
                    : "Starvation risk"}
                </strong>
                <span>{warning.message}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Sources, freshness, and confidence</h3>
      <SourceList sources={comparison.provenance} />
    </section>
  );
}
