export type SeasonUsdQuoteFreshness = 'fresh' | 'stale';

/** A public DEX valuation of the SEASON token, not an in-game payout conversion. */
export type SeasonUsdQuote = Readonly<{
  priceUsd: number;
  liquidityUsd: number;
  dexId: string;
  pairUrl: string;
  quoteTokenSymbol: string;
  sourceUrl: string;
  retrievedAt: string;
  freshness: SeasonUsdQuoteFreshness;
}>;

export type SeasonUsdQuoteResult =
  | Readonly<{ ok: true; quote: SeasonUsdQuote }>
  | Readonly<{ ok: false; message: string }>;

export interface SeasonUsdQuoteProvider {
  getQuote(signal?: AbortSignal): Promise<SeasonUsdQuoteResult>;
}
