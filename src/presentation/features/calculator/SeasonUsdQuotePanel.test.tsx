import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { SeasonUsdQuoteProvider } from '../../../application/ports/SeasonUsdQuoteProvider';
import { SeasonUsdQuotePanel } from './SeasonUsdQuotePanel';

afterEach(cleanup);

const availableProvider: SeasonUsdQuoteProvider = {
  getQuote: async () => ({
    ok: true,
    quote: {
      priceUsd: 0.0125,
      liquidityUsd: 2500,
      dexId: 'uniswap',
      pairUrl: 'https://dexscreener.com/robinhood/deeper',
      quoteTokenSymbol: 'ETH',
      sourceUrl: 'https://api.dexscreener.com/token-pairs/v1/robinhood/example',
      retrievedAt: '2026-11-01T01:00:00.000Z',
      freshness: 'fresh',
    },
  }),
};

describe('SeasonUsdQuotePanel', () => {
  it('renders pair source, liquidity, freshness, and the payout-conversion limitation', async () => {
    render(<SeasonUsdQuotePanel provider={availableProvider} />);

    expect(await screen.findByText('$0.0125')).toBeInTheDocument();
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    expect(screen.getByText('Fresh quote')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view selected pair/i })).toHaveAttribute('href', 'https://dexscreener.com/robinhood/deeper');
    expect(screen.getByText(/cannot calculate the season reward count/i)).toBeInTheDocument();
  });

  it('does not display a mocked value when the public source is unavailable', async () => {
    const unavailableProvider: SeasonUsdQuoteProvider = {
      getQuote: async () => ({ ok: false, message: 'The public SEASON/USD quote is currently unavailable.' }),
    };
    render(<SeasonUsdQuotePanel provider={unavailableProvider} />);

    expect(await screen.findByText(/currently unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/no market value is used/i)).toBeInTheDocument();
    expect(screen.queryByText('$0.0125')).not.toBeInTheDocument();
  });
});
