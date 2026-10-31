import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import { CalculatorApp } from './CalculatorApp';

const validSnapshot = JSON.stringify({
  farm: {
    version: 2,
    level: 4,
    today: { energy: 86, dailyEarningLimit: 18, harvestEarned: 7.5 },
    silo: { wheat: 16, corn: 22, feed: 200 },
    goods: {}, pantry: {}, keep: {},
    animals: [],
  },
  now: 1793405864698,
});

afterEach(cleanup);

describe('CalculatorApp', () => {
  it('shows validation feedback for malformed imports', () => {
    render(<CalculatorApp />);
    fireEvent.change(screen.getByLabelText(/paste snapshot json/i), { target: { value: '{not-json' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze snapshot/i }));
    expect(screen.getByRole('status')).toHaveTextContent('not valid JSON');
  });

  it('renders local rankings and no game-action controls after import', () => {
    render(<CalculatorApp />);
    fireEvent.change(screen.getByLabelText(/paste snapshot json/i), { target: { value: validSnapshot } });
    fireEvent.click(screen.getByRole('button', { name: /analyze snapshot/i }));
    expect(screen.getByText(/ranked by effective hourly net profit/i)).toBeInTheDocument();
    expect(screen.getByText(/live player-market listings and liquidity are not included/i)).toBeInTheDocument();
    const buttonNames = screen.getAllByRole('button').map((button) => button.textContent?.trim());
    expect(buttonNames).not.toContain('SELL');
    expect(buttonNames).not.toContain('BUY');
    expect(buttonNames).not.toContain('PLANT');
    expect(buttonNames).not.toContain('HARVEST');
  });
});
