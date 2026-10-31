export type Freshness = 'fresh' | 'stale' | 'unavailable';

export type PublicMarketContext = Readonly<{
  sourceUrl: string;
  retrievedAt: string;
  sourceUpdatedAt?: string;
  freshness: Freshness;
  prices: Readonly<Record<string, number>>;
}>;

export type PublicMarketContextResult =
  | Readonly<{ ok: true; context: PublicMarketContext }>
  | Readonly<{ ok: false; message: string }>;

export interface PublicMarketContextProvider {
  getContext(signal?: AbortSignal): Promise<PublicMarketContextResult>;
}
