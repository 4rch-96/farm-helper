import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import type {
  EconomyMatrix as EconomyMatrixResult,
  EconomyMatrixRow,
} from '../../../application/use-cases/BuildEconomyMatrix';
import type { CatalogFact, EconomyActivity } from '../../../domain/economy/EconomyCatalog';
import { syntheticVerifiedFixtureSource, unknownFixtureFact } from '../../../test/fixtures/economyCatalog';
import { EconomyMatrix } from './EconomyMatrix';

afterEach(cleanup);

function fact(id: string, label: string, value: number, unit: CatalogFact['unit']): CatalogFact {
  return { id, label, value, unit, source: syntheticVerifiedFixtureSource };
}

function activity(): EconomyActivity {
  return {
    id: 'complete', category: 'crop', label: 'Complete activity',
    unlockLevel: fact('complete.unlock', 'Town Hall unlock', 1, 'Town Hall level'),
    inputs: [], outputs: [], durationHours: fact('complete.duration', 'Duration', 2, 'hours'),
    energyActions: [fact('complete.energy', 'Energy', 2, 'energy')], limits: [], additionalEconomicFacts: [], constraints: [],
  };
}

function completeRow(): Extract<EconomyMatrixRow, { state: 'complete' }> {
  const source = syntheticVerifiedFixtureSource;
  return {
    activityId: 'complete', label: 'Complete activity', state: 'complete', missingFacts: [], rank: 1, requiredUnlockLevel: 1,
    formulaInputs: { activity: activity(), valueMultiplier: fact('multiplier', 'Multiplier', 1, 'multiplier'), sellerFeeRate: fact('fee', 'Seller fee', 0.1, 'percent'), applicableTownHallCapacities: [] },
    metrics: { inputOpportunityCost: 2, directCost: 1, totalCost: 3, grossValue: 10, feeAmount: 1, netPerCycle: 6, netPerHour: 3, netPerEnergy: 3, breakEvenOutputUnitPrice: 3, capacityCaps: [], applicableTownHallCapacities: [] },
    provenance: [source], applicableTownHallCapacities: [],
  };
}

function matrix(rows: ReadonlyArray<EconomyMatrixRow> = [completeRow()]): EconomyMatrixResult {
  return { selectedTownHallLevel: 1, sortMetric: 'net-per-hour', ranking: { status: 'available', comparableActivityCount: 2 }, rows };
}

describe('EconomyMatrix', () => {
  it('exposes accessible Town Hall and declared metric selectors', () => {
    const onTownHallLevelChange = vi.fn();
    const onSortMetricChange = vi.fn();
    render(<EconomyMatrix matrix={matrix()} onTownHallLevelChange={onTownHallLevelChange} onSortMetricChange={onSortMetricChange} />);

    fireEvent.change(screen.getByLabelText(/town hall level/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/sort metric/i), { target: { value: 'net-per-energy' } });

    expect(onTownHallLevelChange).toHaveBeenCalledWith(3);
    expect(onSortMetricChange).toHaveBeenCalledWith('net-per-energy');
    expect(screen.getByText('Net per hour', { selector: '.economy-matrix__sort-note strong' })).toBeInTheDocument();
  });

  it('renders complete, incomplete, and locked rows without ranking unavailable evidence', () => {
    const incomplete: EconomyMatrixRow = {
      activityId: 'incomplete', label: 'Incomplete activity', state: 'incomplete', rank: undefined,
      missingFacts: [{ factId: 'missing.sell-value', factLabel: 'Sell value', source: unknownFixtureFact.source }], applicableTownHallCapacities: [],
    };
    const locked: EconomyMatrixRow = {
      activityId: 'locked', label: 'Locked activity', state: 'locked', rank: undefined, missingFacts: [], applicableTownHallCapacities: [], requiredUnlockLevel: 4,
    };
    render(<EconomyMatrix matrix={matrix([completeRow(), incomplete, locked])} onTownHallLevelChange={vi.fn()} onSortMetricChange={vi.fn()} />);

    expect(screen.getByTestId('economy-row-complete')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByTestId('economy-row-incomplete')).toHaveTextContent('Incomplete: 1 evidence gap');
    expect(screen.getByTestId('economy-row-locked')).toHaveTextContent('Locked until Town Hall 4');
    expect(screen.getAllByText('Unranked')).toHaveLength(2);
  });

  it('includes a per-row responsive summary without hiding the source-aware state', () => {
    render(<EconomyMatrix matrix={matrix()} onTownHallLevelChange={vi.fn()} onSortMetricChange={vi.fn()} />);

    const summary = screen.getByTestId('economy-row-complete').querySelector('[data-responsive-summary="true"]');
    expect(summary).toHaveTextContent('Complete, rank 1');
    expect(summary).toHaveTextContent('3.00 tokens');
  });
});
