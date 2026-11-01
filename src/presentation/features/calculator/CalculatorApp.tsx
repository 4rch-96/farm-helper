import { useMemo, useState } from "react";
import { FarmingSeasonDocumentationCatalog } from "../../../adapters/catalog/FarmingSeasonDocumentationCatalog";
import {
  buildEconomyMatrix,
  type EconomyMatrixSortMetric,
  type EconomyMatrixRow,
} from "../../../application/use-cases/BuildEconomyMatrix";
import type { CatalogFact } from "../../../domain/economy/EconomyCatalog";
import type { SeasonUsdQuoteProvider } from "../../../application/ports/SeasonUsdQuoteProvider";
import {
  FARMING_SEASON_TOWN_HALL_RULES,
  type TownHallLevel,
} from "../../../domain/economy/TownHallRules";
import { ActivityDetail } from "./ActivityDetail";
import { EconomyMatrix } from "./EconomyMatrix";
import { ProductionChainComparison } from "./ProductionChainComparison";
import { SeasonUsdQuotePanel } from "./SeasonUsdQuotePanel";
import "./calculator.css";

const catalogProvider = new FarmingSeasonDocumentationCatalog();
const catalogReviewedAt = catalogProvider.getCatalog().reviewedAt;

/** An explicit gap, not a fee estimate. The matrix contract requires a fact. */
const UNKNOWN_SELLER_FEE_RATE: CatalogFact = Object.freeze({
  id: "seller-fee-rate",
  label: "Seller fee rate",
  value: "unknown",
  unit: "percent",
  source: Object.freeze({
    kind: "unknown",
    reference: "Catalog review: no admissible seller-fee evidence is recorded.",
    observedAt: "2026-10-31",
    dateKind: "catalog-review",
    confidence: "unknown",
  }),
});

export type CalculatorAppProps = Readonly<{
  seasonQuoteProvider?: SeasonUsdQuoteProvider;
}>;

export function CalculatorApp({ seasonQuoteProvider }: CalculatorAppProps) {
  const [townHallLevel, setTownHallLevel] = useState<TownHallLevel>(1);
  const [sortMetric, setSortMetric] =
    useState<EconomyMatrixSortMetric>("net-per-cycle");
  const [selectedActivityId, setSelectedActivityId] = useState<string>();

  const matrix = useMemo(
    () =>
      buildEconomyMatrix({
        catalogProvider,
        townHallRules: FARMING_SEASON_TOWN_HALL_RULES,
        sellerFeeRate: UNKNOWN_SELLER_FEE_RATE,
        selectedTownHallLevel: townHallLevel,
        sortMetric,
      }),
    [sortMetric, townHallLevel],
  );
  const selectedRow =
    matrix.rows.find((row) => row.activityId === selectedActivityId) ??
    matrix.rows[0];

  const selectTownHallLevel = (level: TownHallLevel) => {
    setTownHallLevel(level);
    setSelectedActivityId(undefined);
  };

  const selectMetric = (metric: EconomyMatrixSortMetric) => {
    setSortMetric(metric);
    setSelectedActivityId(undefined);
  };

  const selectActivity = (row: EconomyMatrixRow) =>
    setSelectedActivityId(row.activityId);

  return (
    <main className="planner-shell">
      <header className="planner-topbar">
        <div className="planner-brand">
          <span aria-hidden="true">▦</span>
          <div>
            <strong>ECONOMY MATRIX</strong>
            <small>advisory planner</small>
          </div>
        </div>
        <p>LOCAL CATALOG · NO ACCOUNT REQUIRED</p>
      </header>

      <section className="planner-intro" aria-labelledby="planner-title">
        <div>
          <p className="eyebrow">EVIDENCE-AWARE PLANNING</p>
          <h1 id="planner-title">Compare what the catalog can support.</h1>
        </div>
        <p>
          Choose any Town Hall level. Missing facts stay visible as evidence
          gaps instead of becoming recommendations.
        </p>
      </section>

      <SeasonUsdQuotePanel provider={seasonQuoteProvider} />

      <section
        className="planner-workspace"
        aria-label="Global Town Hall planner"
      >
        <EconomyMatrix
          matrix={matrix}
          selectedActivityId={selectedRow?.activityId}
          onTownHallLevelChange={selectTownHallLevel}
          onSortMetricChange={selectMetric}
          onActivitySelect={selectActivity}
        />
        <ActivityDetail row={selectedRow} />
      </section>

      <ProductionChainComparison />

      <section
        className="planner-evidence"
        aria-label="Planner evidence status"
      >
        <p>
        <strong>Catalog review:</strong> {catalogReviewedAt}
        </p>
        <p>
          Snapshot overlays are optional and are not required to use this
          planner. This view does not use credentials, wallets, sessions, game
          actions, or authenticated game polling. The optional public DEX quote
          is credential-free and never predicts in-game reward conversion.
        </p>
      </section>

      <details className="planner-overlay">
        <summary>Optional local snapshot overlay</summary>
        <p>
          Snapshot support is a future local-only overlay. It does not gate Town
          Hall planning or supply undocumented prices, recipes, fees, or
          production facts.
        </p>
      </details>

      <footer>
        ADVISORY ONLY · VALUES REMAIN INCOMPLETE UNTIL SOURCED · ALL GAME
        ACTIONS STAY MANUAL
      </footer>
    </main>
  );
}
