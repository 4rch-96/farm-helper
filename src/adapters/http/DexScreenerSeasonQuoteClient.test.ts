import { describe, expect, it } from 'vitest';
import {
  DexScreenerSeasonQuoteClient,
  DEX_SCREENER_SEASON_ENDPOINT,
  SEASON_TOKEN_ADDRESS,
} from './DexScreenerSeasonQuoteClient';

const now = () => new Date('2026-11-01T01:00:00.000Z');

function pair(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    chainId: 'robinhood',
    dexId: 'uniswap',
    url: 'https://dexscreener.com/robinhood/pair-a',
    baseToken: { address: SEASON_TOKEN_ADDRESS.toUpperCase(), symbol: 'SEASON' },
    quoteToken: { symbol: 'ETH' },
    priceUsd: '0.0125',
    liquidity: { usd: 1_500 },
    ...overrides,
  };
}

describe('DexScreenerSeasonQuoteClient', () => {
  it('uses an anonymous GET and selects the valid pair with the greatest USD liquidity', async () => {
    let request: RequestInit | undefined;
    let requestedUrl: RequestInfo | URL | undefined;
    const client = new DexScreenerSeasonQuoteClient({
      now,
      fetcher: async (url, init) => {
        requestedUrl = url;
        request = init;
        return new Response(JSON.stringify([
          pair({ liquidity: { usd: 100 }, url: 'https://dexscreener.com/robinhood/smaller' }),
          pair({ liquidity: { usd: 2_500 }, dexId: 'sushi', url: 'https://dexscreener.com/robinhood/deeper', quoteToken: { symbol: 'USDC' } }),
          pair({ chainId: 'other-chain', liquidity: { usd: 9_999 } }),
          pair({ baseToken: { address: '0xwrong', symbol: 'SEASON' }, liquidity: { usd: 9_999 } }),
          pair({ baseToken: { address: SEASON_TOKEN_ADDRESS, symbol: 'WRONG' }, liquidity: { usd: 9_999 } }),
          pair({ priceUsd: '0', liquidity: { usd: 9_999 } }),
        ]), { status: 200 });
      },
    });

    await expect(client.getQuote()).resolves.toEqual({
      ok: true,
      quote: {
        priceUsd: 0.0125,
        liquidityUsd: 2_500,
        dexId: 'sushi',
        pairUrl: 'https://dexscreener.com/robinhood/deeper',
        quoteTokenSymbol: 'USDC',
        sourceUrl: DEX_SCREENER_SEASON_ENDPOINT,
        retrievedAt: '2026-11-01T01:00:00.000Z',
        freshness: 'fresh',
      },
    });
    expect(requestedUrl).toBe(DEX_SCREENER_SEASON_ENDPOINT);
    expect(request).toMatchObject({ method: 'GET', credentials: 'omit' });
  });

  it('returns an unavailable result when no valid pair is available', async () => {
    const client = new DexScreenerSeasonQuoteClient({
      fetcher: async () => new Response(JSON.stringify([pair({ liquidity: { usd: 0 } })]), { status: 200 }),
    });

    await expect(client.getQuote()).resolves.toEqual({
      ok: false,
      message: 'The public quote source returned no valid liquid SEASON pair.',
    });
  });

  it('labels its last successful anonymous quote stale when a later request fails', async () => {
    let call = 0;
    const client = new DexScreenerSeasonQuoteClient({
      now,
      fetcher: async () => {
        call += 1;
        return call === 1
          ? new Response(JSON.stringify([pair()]), { status: 200 })
          : new Response('', { status: 503 });
      },
    });

    await expect(client.getQuote()).resolves.toMatchObject({ ok: true, quote: { freshness: 'fresh' } });
    await expect(client.getQuote()).resolves.toMatchObject({ ok: true, quote: { freshness: 'stale', priceUsd: 0.0125 } });
  });
});
