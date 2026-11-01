import { useState } from "react";
import type { SeasonUsdQuoteProvider } from "../../../application/ports/SeasonUsdQuoteProvider";
import type { ObservedProfitabilityPlan } from "../../../application/use-cases/BuildObservedProfitabilityPlan";
import type { GuideTownHallLevel } from "../../../domain/guide/FarmingSeasonGuide";
import { FarmingPlanner } from "./FarmingPlanner";
import { ObservedPlannerDataSetup } from "./ObservedPlannerDataSetup";
import { SeasonUsdQuotePanel } from "./SeasonUsdQuotePanel";
import "./calculator.css";

export type CalculatorAppProps = Readonly<{
  seasonQuoteProvider?: SeasonUsdQuoteProvider;
}>;

export function CalculatorApp({ seasonQuoteProvider }: CalculatorAppProps) {
  const [townHallLevel, setTownHallLevel] = useState<GuideTownHallLevel>(1);
  const [observedPlan, setObservedPlan] = useState<ObservedProfitabilityPlan>();

  return (
    <main className="planner-shell">
      <header className="planner-topbar">
        <div className="planner-brand">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>FARM HELPER</strong>
            <small>Farming Season planner</small>
          </div>
        </div>
        <p>LOCAL EVIDENCE · NO ACCOUNT REQUIRED</p>
      </header>

      <section className="planner-intro" aria-labelledby="planner-title">
        <div>
          <p className="eyebrow">EVIDENCE-AWARE PLANNING</p>
          <h1 id="planner-title">Make the next farm decision with proof.</h1>
        </div>
        <p>
          Compare a complete alternative only when its observed values and official mechanics use compatible evidence.
        </p>
      </section>

      <SeasonUsdQuotePanel provider={seasonQuoteProvider} />

      <FarmingPlanner
        observedPlan={observedPlan}
        townHallLevel={townHallLevel}
        onTownHallLevelChange={setTownHallLevel}
      />

      <ObservedPlannerDataSetup onPlanChange={setObservedPlan} />

      <section className="planner-evidence" aria-label="Planner privacy and evidence boundary">
        <p><strong>Evidence boundary:</strong> this planner does not use credentials, wallets, sessions, game actions, or authenticated game polling.</p>
        <p>It retains only the safe local planning projection after analysis. Recipes, orders, prices, and rewards stay unavailable until their source evidence is compatible and traceable.</p>
      </section>

      <footer>
        ADVISORY ONLY · VALUES REMAIN INCOMPLETE UNTIL SOURCED · ALL GAME ACTIONS STAY MANUAL
      </footer>
    </main>
  );
}
