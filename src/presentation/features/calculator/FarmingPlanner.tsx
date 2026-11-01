import { useMemo, useState } from "react";
import { FarmingSeasonOfficialGuide } from "../../../adapters/guide/FarmingSeasonOfficialGuide";
import type {
  ObservedProfitabilityMetrics,
  ObservedProfitabilityPlan,
  PlannerEvidence,
} from "../../../application/use-cases/BuildObservedProfitabilityPlan";
import type { FactSource } from "../../../domain/economy/EconomyCatalog";
import type { GuideTownHallLevel } from "../../../domain/guide/FarmingSeasonGuide";

const guide = new FarmingSeasonOfficialGuide().getGuide();

type PlannerCategory = "crops" | "animals" | "processing" | "orders";
type PlannerState = "complete" | "incomplete" | "locked";

type PlannerRow = Readonly<{
  id: string;
  label: string;
  category: PlannerCategory;
  state: PlannerState;
  missing: ReadonlyArray<string>;
  evidence: ReadonlyArray<PlannerEvidence>;
  metrics?: ObservedProfitabilityMetrics;
  rank?: number;
  observedAt?: string;
  requiredTownHall?: GuideTownHallLevel;
}>;

export type FarmingPlannerProps = Readonly<{
  observedPlan?: ObservedProfitabilityPlan;
  townHallLevel: GuideTownHallLevel;
  onTownHallLevelChange: (level: GuideTownHallLevel) => void;
}>;

const CATEGORY_CONTENT: Readonly<Record<PlannerCategory, Readonly<{ label: string; description: string }>>> = Object.freeze({
  crops: Object.freeze({ label: "Crops", description: "Planting and harvest decisions" }),
  animals: Object.freeze({ label: "Animals", description: "Feed, collection, and product decisions" }),
  processing: Object.freeze({ label: "Processing", description: "Recipes and transformation choices" }),
  orders: Object.freeze({ label: "Orders", description: "Requested work and reward choices" }),
});

const RECIPE_LABELS = Object.freeze([
  ["flour", "Flour"],
  ["bread", "Bread"],
  ["cheese", "Cheese"],
  ["butter", "Butter"],
  ["jam", "Jam"],
  ["cloth", "Cloth"],
  ["juice", "Juice"],
] as const);

function officialEvidence(id: string, label: string, source: FactSource): PlannerEvidence {
  return Object.freeze({ id, label, status: "official", source });
}

function unknownEvidence(id: string, label: string): PlannerEvidence {
  return Object.freeze({ id, label, status: "unknown" });
}

function cropFallbackRows(): ReadonlyArray<PlannerRow> {
  const fieldEnergy = guide.energyActions.find((action) => action.id === "plant-or-harvest-field");
  return guide.crops.map((crop) => Object.freeze({
    id: crop.id,
    label: crop.label,
    category: "crops" as const,
    state: "incomplete" as const,
    missing: Object.freeze([
      `observed direct-game payout for ${crop.label.toLowerCase()}`,
      "captured seed cost",
      "compatible in-game token units",
    ]),
    evidence: Object.freeze([
      officialEvidence(`${crop.id}.duration`, "Growth duration", crop.growthHours.source),
      ...(fieldEnergy === undefined
        ? [unknownEvidence(`${crop.id}.energy`, "Plant and harvest energy")]
        : [officialEvidence(`${crop.id}.energy`, "Plant and harvest energy", fieldEnergy.energy.source)]),
    ]),
    requiredTownHall: 1 as GuideTownHallLevel,
  }));
}

function animalFallbackRows(): ReadonlyArray<PlannerRow> {
  const feedingEnergy = guide.energyActions.find((action) => action.id === "feed-building");
  const collectionEnergy = guide.energyActions.find((action) => action.id === "collect-animal-products");
  return guide.animals.map((animal) => Object.freeze({
    id: animal.id,
    label: animal.label,
    category: "animals" as const,
    state: "incomplete" as const,
    missing: Object.freeze([
      "local farm capture",
      `direct-game payout for ${animal.product.toLowerCase()}`,
      "captured feed unit cost",
      "compatible in-game token units",
    ]),
    evidence: Object.freeze([
      officialEvidence(`${animal.id}.unlock`, "Town Hall unlock", animal.unlockLevel.source),
      officialEvidence(`${animal.id}.cadence`, "Product cadence", animal.productCadenceHours.source),
      officialEvidence(`${animal.id}.feed`, "Feed bags per meal", animal.feedBagsPerMeal.source),
      ...(feedingEnergy === undefined
        ? [unknownEvidence(`${animal.id}.feed-energy`, "Feed energy")]
        : [officialEvidence(`${animal.id}.feed-energy`, "Feed energy", feedingEnergy.energy.source)]),
      ...(collectionEnergy === undefined
        ? [unknownEvidence(`${animal.id}.collection-energy`, "Collection energy")]
        : [officialEvidence(`${animal.id}.collection-energy`, "Collection energy", collectionEnergy.energy.source)]),
    ]),
    requiredTownHall: animal.unlockLevel.value,
  }));
}

function processingFallbackRows(rows: ReadonlyArray<PlannerRow>): ReadonlyArray<PlannerRow> {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return RECIPE_LABELS.map(([id, label]) => byId.get(id) ?? Object.freeze({
    id,
    label,
    category: "processing" as const,
    state: "incomplete" as const,
    missing: Object.freeze([
      "recipe inputs and quantities",
      "recipe duration",
      "recipe energy",
      "unit-compatible output payout",
    ]),
    evidence: Object.freeze([
      unknownEvidence(`${id}.recipe`, "Official or observed recipe definition"),
      unknownEvidence(`${id}.reward`, "Compatible output payout"),
    ]),
  }));
}

function orderFallbackRows(): ReadonlyArray<PlannerRow> {
  return [Object.freeze({
    id: "orders-evidence-pending",
    label: "Orders and requests",
    category: "orders" as const,
    state: "incomplete" as const,
    missing: Object.freeze([
      "order inputs and quantities",
      "order duration",
      "order energy",
      "unit-compatible reward",
    ]),
    evidence: Object.freeze([
      unknownEvidence("orders.definition", "Official or observed order definition"),
      unknownEvidence("orders.reward", "Compatible order reward"),
    ]),
  })];
}

function observedRows(plan: ObservedProfitabilityPlan): ReadonlyArray<PlannerRow> {
  return plan.rows.map((row) => Object.freeze({
    id: row.activityId,
    label: row.label,
    category: row.category === "crop" ? "crops" : row.category === "animal" ? "animals" : "processing",
    state: row.state,
    missing: row.state === "incomplete" ? row.missing : Object.freeze([]),
    evidence: row.evidence,
    ...(row.state === "complete" ? {
      metrics: row.metrics,
      rank: row.rank,
      observedAt: row.observedAt,
    } : {}),
    requiredTownHall: row.category === "animal"
      ? guide.animals.find((animal) => animal.id === row.activityId)?.unlockLevel.value
      : row.category === "crop" ? 1 : undefined,
  }));
}

function withTownHallEligibility(row: PlannerRow, selectedTownHall: GuideTownHallLevel): PlannerRow {
  if (row.requiredTownHall === undefined || row.requiredTownHall <= selectedTownHall) return row;

  return Object.freeze({
    ...row,
    state: "locked",
    missing: Object.freeze([`Town Hall ${row.requiredTownHall} is required by the official guide`]),
    metrics: undefined,
    rank: undefined,
  });
}

function createRows(plan: ObservedProfitabilityPlan | undefined, selectedTownHall: GuideTownHallLevel): ReadonlyArray<PlannerRow> {
  const observed = plan === undefined ? [] : observedRows(plan);
  const byCategory = (category: PlannerCategory) => observed.filter((row) => row.category === category);
  const crops = plan === undefined ? cropFallbackRows() : byCategory("crops");
  const animals = plan === undefined ? animalFallbackRows() : byCategory("animals");
  const processing = processingFallbackRows(byCategory("processing"));

  return [
    ...crops,
    ...animals,
    ...processing,
    ...orderFallbackRows(),
  ].map((row) => withTownHallEligibility(row, selectedTownHall));
}

function formatValue(value: number | undefined, suffix = "game-token"): string {
  return value === undefined ? "Not calculable" : `${value.toFixed(2)} ${suffix}`;
}

function formatPercent(value: number | undefined): string {
  return value === undefined ? "Not calculable" : `${(value * 100).toFixed(1)}%`;
}

function stateLabel(row: PlannerRow): string {
  if (row.state === "complete") return row.rank === undefined ? "Complete" : `Complete · rank ${row.rank}`;
  if (row.state === "locked") return "Locked";
  return "Evidence pending";
}

function EvidenceBadge({ status }: Readonly<{ status: PlannerEvidence["status"] }>) {
  const label = status === "official" ? "Official" : status === "observed" ? "Observed" : "Unknown";
  return <span className={`planner-evidence-badge planner-evidence-badge--${status}`}>{label}</span>;
}

function EvidenceList({ evidence }: Readonly<{ evidence: ReadonlyArray<PlannerEvidence> }>) {
  return <ul className="farm-planner__evidence-list">
    {evidence.map((item) => <li key={item.id}>
      <EvidenceBadge status={item.status} />
      <div>
        <strong>{item.label}</strong>
        {item.source === undefined
          ? <span>Source not available yet.</span>
          : <>
            <span>{item.source.reference}</span>
            <span>{item.source.observedAt} · {item.source.confidence}</span>
          </>}
      </div>
    </li>)}
  </ul>;
}

function AlternativeMetrics({ metrics }: Readonly<{ metrics: ObservedProfitabilityMetrics }>) {
  return <dl className="farm-planner__metrics">
    <div><dt>Net benefit</dt><dd>{formatValue(metrics.netBenefit)}</dd></div>
    <div><dt>ROI</dt><dd>{formatPercent(metrics.roi)}</dd></div>
    <div><dt>Benefit / energy</dt><dd>{formatValue(metrics.benefitPerEnergy)}</dd></div>
    <div><dt>Benefit / hour</dt><dd>{formatValue(metrics.benefitPerHour)}</dd></div>
  </dl>;
}

function AlternativeDetail({ row }: Readonly<{ row: PlannerRow }>) {
  const animalRouteBoundary = row.category === "animals"
    ? <p className="farm-planner__route-boundary">Collection and direct-game payout are the only animal route compared here. Storage and processing stay evidence-pending until their destination, recipe, time, energy, and compatible payout are sourced.</p>
    : undefined;

  if (row.state === "complete" && row.metrics !== undefined) {
    return <aside className="farm-planner__detail" aria-label={`${row.label} decision detail`}>
      <div className="farm-planner__detail-heading">
        <div>
          <p className="eyebrow">SELECTED ALTERNATIVE</p>
          <h3>{row.label}</h3>
        </div>
        <EvidenceBadge status="observed" />
      </div>
      <p className="farm-planner__derived">Derived from compatible official mechanics and observed game-token data{row.observedAt === undefined ? "." : ` captured ${row.observedAt.slice(0, 10)}.`}</p>
      <AlternativeMetrics metrics={row.metrics} />
      <p className="farm-planner__formula">Net benefit = observed gross value − observed direct cost. ROI = net benefit ÷ direct cost.</p>
      {animalRouteBoundary}
      <h4>Evidence trail</h4>
      <EvidenceList evidence={row.evidence} />
    </aside>;
  }

  return <aside className="farm-planner__detail" aria-label={`${row.label} evidence detail`}>
    <div className="farm-planner__detail-heading">
      <div>
        <p className="eyebrow">EVIDENCE STATUS</p>
        <h3>{row.label}</h3>
      </div>
      <EvidenceBadge status="unknown" />
    </div>
    <p className="farm-planner__derived">
      {row.state === "locked"
        ? "This alternative is not compared at the selected Town Hall level."
        : "No profitability recommendation is available until these facts are sourced with compatible units."}
    </p>
    {animalRouteBoundary}
    <h4>Still needed</h4>
    <ul className="farm-planner__missing-list">
      {row.missing.map((item) => <li key={item}>{item}</li>)}
    </ul>
    <h4>Known evidence</h4>
    <EvidenceList evidence={row.evidence} />
  </aside>;
}

/**
 * A source-aware decision workspace. It renders calculations only after the
 * application layer has established compatible evidence; presentation never
 * creates a price, reward, recipe, or conversion assumption.
 */
export function FarmingPlanner({
  observedPlan,
  townHallLevel,
  onTownHallLevelChange,
}: FarmingPlannerProps) {
  const rows = useMemo(() => createRows(observedPlan, townHallLevel), [observedPlan, townHallLevel]);
  const [category, setCategory] = useState<PlannerCategory>("crops");
  const [selectedId, setSelectedId] = useState<string>();
  const categoryRows = rows.filter((row) => row.category === category);
  const selectedRow = categoryRows.find((row) => row.id === selectedId) ?? categoryRows[0];
  const selectedTownHall = guide.townHalls.find((level) => level.level === townHallLevel) ?? guide.townHalls[0];

  const selectCategory = (nextCategory: PlannerCategory) => {
    setCategory(nextCategory);
    setSelectedId(rows.find((row) => row.category === nextCategory)?.id);
  };

  return <section className="farm-planner" aria-labelledby="farm-planner-title">
    <div className="farm-planner__heading">
      <div>
        <p className="eyebrow">FARM DECISION BOARD</p>
        <h2 id="farm-planner-title">Plan with the evidence you have.</h2>
        <p>Only complete, compatible alternatives receive a rank. Every other option says exactly what is missing.</p>
      </div>
      <div className="farm-planner__town-hall">
        <label htmlFor="planner-town-hall">Town Hall level
          <select
            id="planner-town-hall"
            value={townHallLevel}
            onChange={(event) => onTownHallLevelChange(Number(event.target.value) as GuideTownHallLevel)}
          >
            {guide.townHalls.map((level) => <option key={level.level} value={level.level}>Town Hall {level.level}</option>)}
          </select>
        </label>
        <p>Only verified levels 1–5 are shown. Town Hall 6 and 7 are not presented as available.</p>
      </div>
    </div>

    <dl className="farm-planner__town-hall-facts" aria-label={`Town Hall ${townHallLevel} official mechanics`}>
      <div><dt>Max fields</dt><dd>{selectedTownHall?.maxFields.value ?? "Unknown"}</dd></div>
      <div><dt>Produce value</dt><dd>×{selectedTownHall?.produceValueMultiplier.value ?? "Unknown"}</dd></div>
      <div><dt>Animal capacity</dt><dd>×{selectedTownHall?.animalCapacityMultiplier.value ?? "Unknown"}</dd></div>
      <div><dt>Source</dt><dd>Official guide · {selectedTownHall?.maxFields.source.observedAt ?? "Unknown"}</dd></div>
    </dl>

    <p className="farm-planner__market-boundary">The public SEASON/USD panel is market context only. It never determines an in-game reward count.</p>

    <div className="farm-planner__tabs" role="tablist" aria-label="Planner categories">
      {(Object.keys(CATEGORY_CONTENT) as PlannerCategory[]).map((key) => {
        const content = CATEGORY_CONTENT[key];
        const count = rows.filter((row) => row.category === key).length;
        return <button
          key={key}
          id={`planner-tab-${key}`}
          type="button"
          role="tab"
          aria-selected={category === key}
          aria-controls={`planner-panel-${key}`}
          onClick={() => selectCategory(key)}
        >
          <span>{content.label}</span>
          <small>{count} alternatives</small>
        </button>;
      })}
    </div>

    <div
      id={`planner-panel-${category}`}
      className="farm-planner__workspace"
      role="tabpanel"
      aria-labelledby={`planner-tab-${category}`}
    >
      <section className="farm-planner__alternatives" aria-labelledby="planner-alternatives-title">
        <div className="farm-planner__section-heading">
          <div>
            <p className="eyebrow">{CATEGORY_CONTENT[category].label}</p>
            <h3 id="planner-alternatives-title">{CATEGORY_CONTENT[category].description}</h3>
          </div>
          <p>{observedPlan === undefined ? "Load local evidence to calculate a compatible alternative." : `Captured ${observedPlan.capturedAt.slice(0, 10)}.`}</p>
        </div>
        <ul className="farm-planner__alternatives-list">
          {categoryRows.map((row) => <li key={row.id}>
            <button
              type="button"
              className="farm-planner__alternative"
              aria-pressed={selectedRow?.id === row.id}
              onClick={() => setSelectedId(row.id)}
            >
              <span className="farm-planner__alternative-main">
                <strong>{row.label}</strong>
                <span>{stateLabel(row)}</span>
              </span>
              {row.state === "complete" && row.metrics !== undefined
                ? <span className="farm-planner__alternative-value">{formatValue(row.metrics.netBenefit)}</span>
                : <span className="farm-planner__alternative-value">Needs evidence</span>}
            </button>
          </li>)}
        </ul>
      </section>
      {selectedRow === undefined
        ? <aside className="farm-planner__detail" aria-label="Planner guidance">Choose a category to inspect its evidence.</aside>
        : <AlternativeDetail row={selectedRow} />}
    </div>
  </section>;
}
