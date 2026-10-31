import type {
  PublicMarketContext,
  PublicMarketContextProvider,
  PublicMarketContextResult,
} from '../../application/ports/PublicMarketContextProvider';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type UnknownRecord = Record<string, unknown>;

export type FarmingSeasonPublicContextClientOptions = Readonly<{
  endpoint?: string;
  fetcher?: FetchLike;
  now?: () => Date;
  timeoutMs?: number;
  freshnessMs?: number;
}>;

const DEFAULT_ENDPOINT = 'https://farmingseason.io/api/rwa';
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_FRESHNESS_MS = 15 * 60 * 1_000;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTimestamp(value: unknown, fallback: Date): Date {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value);
  }

  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value);
  }

  return fallback;
}

function parsePrices(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const prices: Record<string, number> = {};
  for (const [item, price] of Object.entries(value)) {
    if (typeof price === 'number' && Number.isFinite(price) && price >= 0) {
      prices[item] = price;
    }
  }

  return Object.keys(prices).length > 0 ? prices : undefined;
}

export class FarmingSeasonPublicContextClient implements PublicMarketContextProvider {
  private readonly endpoint: string;
  private readonly fetcher: FetchLike;
  private readonly now: () => Date;
  private readonly timeoutMs: number;
  private readonly freshnessMs: number;

  public constructor(options: FarmingSeasonPublicContextClientOptions = {}) {
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? (() => new Date());
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.freshnessMs = options.freshnessMs ?? DEFAULT_FRESHNESS_MS;
  }

  public async getContext(signal?: AbortSignal): Promise<PublicMarketContextResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const forwardAbort = () => controller.abort();
    signal?.addEventListener('abort', forwardAbort, { once: true });

    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'GET',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        return { ok: false, message: 'This source requires authentication and cannot be used for public context.' };
      }
      if (!response.ok) {
        return { ok: false, message: 'Public context is currently unavailable.' };
      }

      const payload: unknown = await response.json();
      if (!isRecord(payload)) {
        return { ok: false, message: 'Public context returned an invalid payload.' };
      }

      const prices = parsePrices(payload.prices ?? payload.rwa ?? payload.data);
      if (prices === undefined) {
        return { ok: false, message: 'Public context did not include valid prices.' };
      }

      const retrieved = this.now();
      const sourceTime = parseTimestamp(payload.updatedAt ?? payload.timestamp ?? payload.at, retrieved);
      const context: PublicMarketContext = {
        sourceUrl: this.endpoint,
        retrievedAt: retrieved.toISOString(),
        sourceUpdatedAt: sourceTime.toISOString(),
        freshness: retrieved.getTime() - sourceTime.getTime() > this.freshnessMs ? 'stale' : 'fresh',
        prices,
      };
      return { ok: true, context };
    } catch (error) {
      const isAborted = error instanceof DOMException && error.name === 'AbortError';
      return { ok: false, message: isAborted ? 'Public context request timed out.' : 'Public context is currently unavailable.' };
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', forwardAbort);
    }
  }
}
