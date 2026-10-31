import { useMemo, useRef, useState } from 'react';
import { JsonFarmSnapshotImporter } from '../../../adapters/import/JsonFarmSnapshotImporter';
import { analyzeFarmProfitability, type ScenarioDefinition, type ScenarioRecommendation } from '../../../application/use-cases/AnalyzeFarmProfitability';
import { createMarketGuidance } from '../../../application/use-cases/CreateMarketGuidance';
import type { FarmSnapshot } from '../../../domain/farm/FarmSnapshot';
import './calculator.css';

type ImportState = {
  snapshot: FarmSnapshot;
  warnings: readonly string[];
} | undefined;

const importer = new JsonFarmSnapshotImporter();

const tokens = (value: number | undefined): string => value === undefined ? '—' : `${value.toFixed(2)} SEASON`;
const percent = (value: number | undefined): string => value === undefined ? '—' : `${(value * 100).toFixed(1)}%`;

function createScenarios(snapshot: FarmSnapshot): ScenarioDefinition[] {
  const feed = snapshot.silo.feed;
  const egg = snapshot.inventory.egg ?? 0;
  const milk = snapshot.inventory.milk ?? 0;

  return [
    {
      id: 'feed-reserve', label: 'Feed reserve', requiredLevel: 2, timeframe: '12-hour planning window',
      assumptions: ['Illustrative baseline: 2.2 SEASON per feed bag.', '5% seller fee is modeled.', 'Replace with verified market data before listing.'],
      input: { grossValue: feed * 2.2, directCost: 0, durationHours: 12, energyCost: 2, sellerFeeRate: 0.05 },
    },
    {
      id: 'egg-basket', label: 'Egg basket', requiredLevel: 1, timeframe: '24-hour planning window',
      assumptions: ['Illustrative baseline: 16 SEASON per egg.', 'Production and price vary by season.', '5% seller fee is modeled.'],
      input: { grossValue: egg * 16, directCost: 0, durationHours: 24, energyCost: 2, sellerFeeRate: 0.05 },
    },
    {
      id: 'milk-run', label: 'Milk run', requiredLevel: 2, timeframe: '24-hour planning window',
      assumptions: ['Illustrative baseline: 63 SEASON per milk.', 'Production and price vary by season.', '5% seller fee is modeled.'],
      input: { grossValue: milk * 63, directCost: 0, durationHours: 24, energyCost: 2, sellerFeeRate: 0.05 },
    },
  ];
}

function RecommendationRow({ recommendation, selected, onSelect }: { recommendation: ScenarioRecommendation; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`rank-row ${selected ? 'is-selected' : ''}`} onClick={onSelect}>
    <span className="rank-row__crop" aria-hidden="true">✦</span>
    <span className="rank-row__name"><strong>{recommendation.label}</strong><small>{recommendation.timeframe}</small></span>
    <span><small>Net / hr</small><strong>{tokens(recommendation.ranking.value)}</strong></span>
    <span><small>Energy</small><strong>{tokens(recommendation.metrics.energyEfficiency)}</strong></span>
    <span><small>ROI</small><strong>{percent(recommendation.metrics.roi)}</strong></span>
  </button>;
}

export function CalculatorApp() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [rawJson, setRawJson] = useState('');
  const [importState, setImportState] = useState<ImportState>();
  const [message, setMessage] = useState('Import a farm snapshot to open the field ledger.');
  const [selectedId, setSelectedId] = useState<string>();

  const analysis = useMemo(() => importState === undefined ? undefined : analyzeFarmProfitability({ snapshot: importState.snapshot, scenarios: createScenarios(importState.snapshot) }), [importState]);
  const selected = analysis?.scenarios.find((scenario) => scenario.id === selectedId) ?? analysis?.scenarios[0];
  const guidance = selected === undefined ? undefined : createMarketGuidance({ item: selected.label, baselineValue: selected.formulaInputs.grossValue, sellerFeeRate: selected.formulaInputs.sellerFeeRate ?? 0.05, sourceTimestamp: importState?.snapshot.importedAt });

  const importText = (text: string) => {
    setRawJson(text);
    const result = importer.import(text);
    if (!result.ok) { setImportState(undefined); setMessage(result.message); return; }
    setImportState({ snapshot: result.snapshot, warnings: result.warnings });
    setSelectedId(undefined);
    setMessage('Snapshot stays in this browser session. No game action is available here.');
  };

  return <main className="farm-shell">
    <header className="topbar"><div className="brand"><span className="brand__sprout" aria-hidden="true">✦</span><span>FIELD LEDGER</span><small>read-only companion</small></div><div className="topbar__status"><span className={importState ? 'pixel-dot fresh' : 'pixel-dot'} aria-hidden="true" /> {importState ? 'LOCAL SNAPSHOT READY' : 'WAITING FOR SNAPSHOT'}</div></header>
    <section className="workspace">
      <aside className="import-rail" aria-label="Snapshot import">
        <p className="eyebrow">FARM DATA · LOCAL ONLY</p><h1>Choose the next harvest.</h1>
        <p className="rail-copy">Paste or select your exported farm JSON. It is analyzed in this browser and never asks for a wallet, cookie, or game action.</p>
        <div className="import-actions"><button className="harvest-button" onClick={() => importText(rawJson)}>ANALYZE SNAPSHOT</button><button className="ghost-button" onClick={() => fileInput.current?.click()}>CHOOSE JSON FILE</button><input ref={fileInput} type="file" accept="application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then(importText); }} /></div>
        <label className="paste-label" htmlFor="snapshot-json">Paste snapshot JSON</label><textarea id="snapshot-json" value={rawJson} onChange={(event) => setRawJson(event.target.value)} placeholder={'{ "farm": { ... } }'} spellCheck="false" />
        <p className="import-message" role="status">{message}</p>
        {importState?.warnings.map((warning) => <p className="warning" key={warning}>⚠ {warning}</p>)}
      </aside>
      <section className="ledger" aria-label="Profitability analysis">
        <div className="ledger__header"><div><p className="eyebrow">DECISION LEDGER</p><h2>{importState ? `Town Hall ${importState.snapshot.level} · ${importState.snapshot.energy} energy` : 'Your rankings will grow here'}</h2></div>{importState && <p className="freshness">Imported {new Date(importState.snapshot.importedAt).toLocaleString()}</p>}</div>
        {analysis === undefined ? <div className="empty-state"><span aria-hidden="true">🌾</span><p>Bring in a snapshot to compare transparent, illustrative scenarios.</p></div> : <><div className="ranking-label"><span>RANKED BY EFFECTIVE HOURLY NET PROFIT</span><span>ESTIMATES · NOT FINANCIAL ADVICE</span></div><div className="ranking">{analysis.scenarios.map((scenario) => <RecommendationRow key={scenario.id} recommendation={scenario} selected={selected?.id === scenario.id} onSelect={() => setSelectedId(scenario.id)} />)}</div>{analysis.unavailableScenarios.length > 0 && <div className="unavailable"><strong>Unavailable today</strong>{analysis.unavailableScenarios.map((scenario) => <span key={scenario.id}>{scenario.label}: {scenario.reason}</span>)}</div>}</>}
      </section>
      <aside className="inspector" aria-label="Recommendation detail">
        <p className="eyebrow">FIELD INSPECTOR</p>{selected === undefined ? <p className="inspector__empty">Select a scenario after importing a snapshot.</p> : <><h2>{selected.label}</h2><p className="inspector__metric">{tokens(selected.ranking.value)} <small>effective net / hr</small></p><dl><div><dt>Gross input</dt><dd>{tokens(selected.metrics.grossValue)}</dd></div><div><dt>Seller fee</dt><dd>−{tokens(selected.metrics.feeAmount)}</dd></div><div><dt>Net value</dt><dd>{tokens(selected.metrics.netValue)}</dd></div><div><dt>Payback</dt><dd>{selected.metrics.paybackHours === undefined ? 'Unavailable' : `${selected.metrics.paybackHours.toFixed(1)}h`}</dd></div></dl><div className="formula"><strong>Formula</strong><code>net value − direct cost = net profit</code></div><ul className="assumptions">{selected.assumptions.map((item) => <li key={item}>{item}</li>)}{selected.limitations.map((item) => <li key={item}>{item}</li>)}</ul>{guidance?.available && <div className="market-note"><strong>Market guidance</strong><span>Target before fee: {tokens(guidance.grossTargetValue)}</span><small>Live player-market listings and liquidity are not included. Any listing must be made manually in the game.</small></div>}</>}</aside>
    </section>
    <footer>FIELD LEDGER IS INDEPENDENT · NO WALLET KEYS · NO SESSION STORAGE · ALL GAME ACTIONS STAY MANUAL</footer>
  </main>;
}
