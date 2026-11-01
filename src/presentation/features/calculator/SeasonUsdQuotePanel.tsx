import { useEffect, useMemo, useState } from 'react';
import { DexScreenerSeasonQuoteClient } from '../../../adapters/http/DexScreenerSeasonQuoteClient';
import type {
  SeasonUsdQuote,
  SeasonUsdQuoteProvider,
  SeasonUsdQuoteResult,
} from '../../../application/ports/SeasonUsdQuoteProvider';

export type SeasonUsdQuotePanelProps = Readonly<{
  provider?: SeasonUsdQuoteProvider;
}>;

type QuoteState =
  | Readonly<{ state: 'loading' }>
  | Readonly<{ state: 'available'; quote: SeasonUsdQuote }>
  | Readonly<{ state: 'unavailable'; message: string }>;

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 8,
  }).format(value);
}

function formatTimestamp(value: string): string {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? 'Unknown' : timestamp.toLocaleString('en-US');
}

function toState(result: SeasonUsdQuoteResult): QuoteState {
  return result.ok
    ? Object.freeze({ state: 'available', quote: result.quote })
    : Object.freeze({ state: 'unavailable', message: result.message });
}

/** Renders a public DEX valuation without implying an in-game payout conversion. */
export function SeasonUsdQuotePanel({ provider }: SeasonUsdQuotePanelProps) {
  const defaultProvider = useMemo(() => new DexScreenerSeasonQuoteClient(), []);
  const activeProvider = provider ?? defaultProvider;
  const [state, setState] = useState<QuoteState>({ state: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    setState({ state: 'loading' });
    activeProvider.getQuote(controller.signal)
      .then((result) => {
        if (mounted) setState(toState(result));
      })
      .catch(() => {
        if (mounted) setState({ state: 'unavailable', message: 'The public SEASON/USD quote is currently unavailable.' });
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [activeProvider]);

  if (state.state === 'loading') {
    return <section className="season-quote" aria-labelledby="season-quote-title" aria-busy="true">
      <p className="eyebrow">PUBLIC MARKET SIGNAL</p>
      <h2 id="season-quote-title">SEASON / USD</h2>
      <p className="season-quote__status" role="status">Loading a credential-free public quote…</p>
    </section>;
  }

  if (state.state === 'unavailable') {
    return <section className="season-quote season-quote--unavailable" aria-labelledby="season-quote-title">
      <p className="eyebrow">PUBLIC MARKET SIGNAL</p>
      <h2 id="season-quote-title">SEASON / USD</h2>
      <p className="season-quote__status" role="status">{state.message}</p>
      <p className="season-quote__limitation">No market value is used in planner calculations while this quote is unavailable.</p>
    </section>;
  }

  const { quote } = state;
  return <section className={`season-quote season-quote--${quote.freshness}`} aria-labelledby="season-quote-title">
    <div className="season-quote__heading">
      <div>
        <p className="eyebrow">PUBLIC MARKET SIGNAL</p>
        <h2 id="season-quote-title">SEASON / USD</h2>
      </div>
      <p className="season-quote__freshness" role="status">{quote.freshness === 'fresh' ? 'Fresh quote' : 'Stale — last known quote'}</p>
    </div>
    <p className="season-quote__price">{formatUsd(quote.priceUsd)} <span>per SEASON</span></p>
    <dl className="season-quote__details">
      <div><dt>Selected pair liquidity</dt><dd>{formatUsd(quote.liquidityUsd)}</dd></div>
      <div><dt>DEX / quote token</dt><dd>{quote.dexId} · {quote.quoteTokenSymbol}</dd></div>
      <div><dt>Retrieved</dt><dd>{formatTimestamp(quote.retrievedAt)}</dd></div>
    </dl>
    <p className="season-quote__source"><a href={quote.pairUrl} target="_blank" rel="noreferrer">View selected pair on DexScreener</a></p>
    <p className="season-quote__limitation">This quote can value a known SEASON amount in USD. It cannot calculate the SEASON reward count without the game’s current payout conversion and reward-pool share.</p>
  </section>;
}
