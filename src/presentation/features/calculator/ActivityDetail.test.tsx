import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import type { EconomyMatrixRow } from '../../../application/use-cases/BuildEconomyMatrix';
import type { CatalogFact, EconomyActivity } from '../../../domain/economy/EconomyCatalog';
import { syntheticVerifiedFixtureSource, unknownFixtureFact } from '../../../test/fixtures/economyCatalog';
import { ActivityDetail } from './ActivityDetail';

afterEach(cleanup);

function fact(id: string, label: string, value: number, unit: CatalogFact['unit']): CatalogFact {
  return { id, label, value, unit, source: syntheticVerifiedFixtureSource };
}

function completeRow(): Extract<EconomyMatrixRow, { state: 'complete' }> {
  const activity: EconomyActivity = {
    id: 'mill', category: 'processing', label: 'Source-backed mill', unlockLevel: fact('mill.unlock', 'Town Hall unlock', 1, 'Town Hall level'),
    inputs: [], outputs: [], durationHours: fact('mill.duration', 'Duration', 2, 'hours'), energyActions: [],
    limits: [fact('mill.limit', 'Daily mill limit', 4, 'items')], additionalEconomicFacts: [],
    constraints: [{ id: 'mill.constraint', label: 'Workshop availability', source: syntheticVerifiedFixtureSource }],
  };
  return {
    activityId: 'mill', label: 'Source-backed mill', state: 'complete', missingFacts: [], rank: 1, requiredUnlockLevel: 1,
    formulaInputs: { activity, valueMultiplier: fact('multiplier', 'Town Hall multiplier', 1, 'multiplier'), sellerFeeRate: fact('fee', 'Seller fee', 0.1, 'percent'), applicableTownHallCapacities: [fact('field-capacity', 'Field capacity', 6, 'items')] },
    metrics: { inputOpportunityCost: 2, directCost: 1, totalCost: 3, grossValue: 10, feeAmount: 1, netPerCycle: 6, netPerHour: 3, netPerEnergy: 2, breakEvenOutputUnitPrice: 3, capacityCaps: [], applicableTownHallCapacities: [] },
    provenance: [syntheticVerifiedFixtureSource], applicableTownHallCapacities: [{ id: 'field-capacity', label: 'Field capacity', value: 6, fact: fact('field-capacity', 'Field capacity', 6, 'items') }],
  };
}

describe('ActivityDetail', () => {
  it('discloses the formula, source references, freshness, assumptions, confidence, and limits for a complete row', () => {
    render(<ActivityDetail row={completeRow()} />);

    expect(screen.getByText(/net per cycle = gross value/i)).toBeInTheDocument();
    expect(screen.getByText('test://economy-catalog/synthetic-verified-fact')).toBeInTheDocument();
    expect(screen.getAllByText(/freshness: 2026-01-01 \(observed\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/confidence: verified/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Workshop availability')).toBeInTheDocument();
    expect(screen.getByText(/daily mill limit: 4 items/i)).toBeInTheDocument();
    expect(screen.getByText(/field capacity: 6 items/i)).toBeInTheDocument();
    expect(screen.getByText(/no named evidence gaps/i)).toBeInTheDocument();
  });

  it('names evidence gaps and preserves their source metadata for incomplete rows', () => {
    const row: EconomyMatrixRow = {
      activityId: 'missing', label: 'Evidence pending activity', state: 'incomplete', rank: undefined, applicableTownHallCapacities: [],
      missingFacts: [{ factId: 'missing.sell-value', factLabel: 'Sell value', source: unknownFixtureFact.source }],
    };
    render(<ActivityDetail row={row} />);

    expect(screen.getByText(/formula unavailable until every required fact/i)).toBeInTheDocument();
    expect(screen.getByText('Sell value')).toBeInTheDocument();
    expect(screen.getByText('missing.sell-value')).toBeInTheDocument();
    expect(screen.getByText(/test fixture: no admissible source recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence: unknown/i)).toBeInTheDocument();
  });

  it('describes a locked row without inventing a calculation', () => {
    const row: EconomyMatrixRow = {
      activityId: 'locked', label: 'Future workshop', state: 'locked', rank: undefined, missingFacts: [], applicableTownHallCapacities: [], requiredUnlockLevel: 5,
    };
    render(<ActivityDetail row={row} />);

    expect(screen.getByText(/locked until town hall 5/i)).toBeInTheDocument();
    expect(screen.getByText(/no named evidence gaps/i)).toBeInTheDocument();
  });
});
