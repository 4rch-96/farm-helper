import { useMemo, useState } from "react";
import { FarmingSeasonOfficialGuide } from "../../../adapters/guide/FarmingSeasonOfficialGuide";
import { JsonLocalGameCaptureImporter } from "../../../adapters/import/JsonLocalGameCaptureImporter";
import {
  createLocalGameCapture,
  type LocalGameCapture,
  type ObservedValue,
} from "../../../domain/observations/LocalGameCapture";
import {
  buildObservedProfitabilityPlan,
  cropSeedCostKey,
  type ObservedProfitabilityPlan,
} from "../../../application/use-cases/BuildObservedProfitabilityPlan";

const guide = new FarmingSeasonOfficialGuide().getGuide();
const captureImporter = new JsonLocalGameCaptureImporter();

export type ObservedPlannerDataSetupProps = Readonly<{
  onPlanChange: (plan: ObservedProfitabilityPlan | undefined) => void;
}>;

function isObservedDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
}

function seedCostObservation(value: number, observedAt: string): ObservedValue {
  return Object.freeze({
    value,
    unit: "game-token",
    capturedAt: new Date(`${observedAt}T00:00:00.000Z`).toISOString(),
    source: Object.freeze({
      kind: "captured-game-ui",
      reference: "Player-entered local observation: crop seed cost",
      observedAt,
      dateKind: "observed",
      confidence: "captured",
    }),
  });
}

function withSeedCost(
  capture: LocalGameCapture,
  cropId: string,
  cost: number,
  observedAt: string,
): LocalGameCapture {
  return createLocalGameCapture({
    farm: capture.farm,
    directPayouts: capture.directPayouts,
    directUnitCosts: {
      ...capture.directUnitCosts,
      [cropSeedCostKey(cropId)]: seedCostObservation(cost, observedAt),
    },
    ...(capture.market === undefined ? {} : { market: capture.market }),
  });
}

/**
 * Collects an optional player-provided planning projection. Source text exists
 * only in the controlled textarea until submit; the retained value is the
 * importer projection, never the source capture.
 */
export function ObservedPlannerDataSetup({ onPlanChange }: ObservedPlannerDataSetupProps) {
  const [rawCapture, setRawCapture] = useState("");
  const [capture, setCapture] = useState<LocalGameCapture>();
  const [message, setMessage] = useState("No local observations loaded.");
  const [selectedCropId, setSelectedCropId] = useState(guide.crops[0]?.id ?? "");
  const [seedCost, setSeedCost] = useState("");
  const [observedDate, setObservedDate] = useState("");

  const plan = useMemo(
    () => capture === undefined ? undefined : buildObservedProfitabilityPlan(guide, capture),
    [capture],
  );

  const importCapture = () => {
    const result = captureImporter.import(rawCapture);
    setRawCapture("");

    if (!result.ok) {
      setCapture(undefined);
      onPlanChange(undefined);
      setMessage(result.message);
      return;
    }

    setCapture(result.capture);
    onPlanChange(buildObservedProfitabilityPlan(guide, result.capture));
    setMessage(
      result.warnings.length === 0
        ? `Observed data loaded from ${result.capture.farm.capturedAt.slice(0, 10)}.`
        : result.warnings.join(" "),
    );
  };

  const recordSeedCost = () => {
    if (capture === undefined) {
      setMessage("Load a local observation before recording a crop seed cost.");
      return;
    }

    const value = Number(seedCost);
    if (!Number.isFinite(value) || value < 0) {
      setMessage("Observed seed cost must be a non-negative number.");
      return;
    }
    if (!isObservedDate(observedDate)) {
      setMessage("Observation date is required.");
      return;
    }

    const nextCapture = withSeedCost(capture, selectedCropId, value, observedDate);
    setCapture(nextCapture);
    onPlanChange(buildObservedProfitabilityPlan(guide, nextCapture));
    setSeedCost("");
    setMessage(`Observed seed cost saved for ${guide.crops.find((crop) => crop.id === selectedCropId)?.label ?? selectedCropId}.`);
  };

  return (
    <section className="planner-local-data" aria-labelledby="local-data-title">
      <div>
        <p className="eyebrow">OPTIONAL LOCAL EVIDENCE</p>
        <h2 id="local-data-title">Use a local game capture</h2>
        <p>
          Paste a player-provided capture to calculate only what its sourced data can support.
          The source text is processed in memory, cleared after analysis, and never saved.
        </p>
      </div>

      <label htmlFor="local-capture-json">
        Local capture JSON
        <textarea
          id="local-capture-json"
          value={rawCapture}
          onChange={(event) => setRawCapture(event.target.value)}
          placeholder="Paste a local capture JSON"
          spellCheck={false}
        />
      </label>
      <button type="button" onClick={importCapture}>Analyze local capture</button>
      <p className="planner-local-data__status" role="status">{message}</p>

      <p className="planner-local-data__privacy">
        Do not paste cookies, wallet data, credentials, private URLs, or authentication tokens.
        Credential-shaped input is rejected and no raw capture is retained.
      </p>
      <p className="planner-local-data__privacy">
        Imported values are labelled as observed game-token data. A public SEASON/USD quote is
        separate market context and never predicts an in-game reward.
      </p>

      <fieldset disabled={capture === undefined}>
        <legend>Observed crop seed cost</legend>
        <label htmlFor="observed-crop-id">
          Crop
          <select
            id="observed-crop-id"
            value={selectedCropId}
            onChange={(event) => setSelectedCropId(event.target.value)}
          >
            {guide.crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.label}</option>)}
          </select>
        </label>
        <label htmlFor="observed-seed-cost">
          Seed cost (observed game-token unit)
          <input
            id="observed-seed-cost"
            inputMode="decimal"
            type="number"
            min="0"
            step="any"
            value={seedCost}
            onChange={(event) => setSeedCost(event.target.value)}
          />
        </label>
        <label htmlFor="observed-seed-date">
          Observation date
          <input
            id="observed-seed-date"
            type="date"
            value={observedDate}
            onChange={(event) => setObservedDate(event.target.value)}
          />
        </label>
        <button type="button" onClick={recordSeedCost}>Record observed seed cost</button>
      </fieldset>

      {plan !== undefined && (
        <p className="planner-local-data__summary" data-testid="observed-plan-summary">
          Observed plan: {plan.ranking.completeActivityCount} complete alternative{plan.ranking.completeActivityCount === 1 ? "" : "s"};
          ranking {plan.ranking.status} by benefit per energy.
        </p>
      )}
    </section>
  );
}
