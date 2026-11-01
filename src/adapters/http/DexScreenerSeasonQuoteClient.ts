import type {
  SeasonUsdQuote,
  SeasonUsdQuoteProvider,
  SeasonUsdQuoteResult,
} from '../../application/ports/SeasonUsdQuoteProvider';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type UnknownRecord = Record<string, unknown>;

type CandidatePair = Readonly<{
  priceUsd: number;
  liquidityUsd: number;
  dexId: string;
  pairUrl: string;
  quoteTokenSymbol: string;
}>;

export type DexScreenerSeasonQuoteClientOptions = Readonly<{
  endpoint?: string;
  fetcher?: FetchLike;
  now?: () => Date;
  timeoutMs?: number;
}>;

export const SEASON_TOKEN_ADDRESS = '0xea0071a8778fa02c12378e88868255e0e0952be6';
export const DEX_SCREENER_SEASON_ENDPOINT = `https://api.dexscreener.com/token-pairs/v1/robinhood/${SEASON_TOKEN_ADDRESS}`;

const ROBINHOOD_CHAIN = 'robinhood';
const SEASON_SYMBOL = 'SEASON';
const DEFAULT_TIMEOUT_MS = 8_000;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function stringAt(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function validUrl(value: unknown): string | undefined {
  const candidate = stringAt(value);
  if (candidate === undefined) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function candidatePair(value: unknown): CandidatePair | undefined {
  if (!isRecord(value)) return undefined;
  const baseToken = isRecord(value.baseToken) ? value.baseToken : undefined;
  const quoteToken = isRecord(value.quoteToken) ? value.quoteToken : undefined;
  const chainId = stringAt(value.chainId);
  const baseAddress = stringAt(baseToken?.address);
  const baseSymbol = stringAt(baseToken?.symbol);
  const priceUsd = positiveNumber(value.priceUsd);
  const liquidityUsd = isRecord(value.liquidity) ? positiveNumber(value.liquidity.usd) : undefined;
  const dexId = stringAt(value.dexId);
  const pairUrl = validUrl(value.url);
  const quoteTokenSymbol = stringAt(quoteToken?.symbol);

  if (chainId?.toLowerCase() !== ROBINHOOD_CHAIN
    || baseAddress?.toLowerCase() !== SEASON_TOKEN_ADDRESS
    || baseSymbol?.toUpperCase() !== SEASON_SYMBOL
    || priceUsd === undefined
    || liquidityUsd === undefined
    || dexId === undefined
    || pairUrl === undefined
    || quoteTokenSymbol === undefined) {
    return undefined;
  }

  return Object.freeze({ priceUsd, liquidityUsd, dexId, pairUrl, quoteTokenSymbol });
}

function selectPair(payload: unknown): CandidatePair | undefined {
  if (!Array.isArray(payload)) return undefined;

  const candidates = payload
    .map(candidatePair)
    .filter((candidate): candidate is CandidatePair => candidate !== undefined);
  return candidates.sort((left, right) => right.liquidityUsd - left.liquidityUsd)[0];
}

/**
 * Retrieves an anonymous public DEX valuation. The quote never represents an
 * in-game reward conversion, which is controlled separately by game state.
 */
export class DexScreenerSeasonQuoteClient implements SeasonUsdQuoteProvider {
  private readonly endpoint: string;
  private readonly fetcher: FetchLike;
  private readonly now: () => Date;
  private readonly timeoutMs: number;
  private lastQuote: SeasonUsdQuote | undefined;

  public constructor(options: DexScreenerSeasonQuoteClientOptions = {}) {
    this.endpoint = options.endpoint ?? DEX_SCREENER_SEASON_ENDPOINT;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? (() => new Date());
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  public async getQuote(signal?: AbortSignal): Promise<SeasonUsdQuoteResult> {
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
        return this.unavailable('The public quote source requires authentication.');
      }
      if (!response.ok) {
        return this.unavailable('The public SEASON/USD quote is currently unavailable.');
      }

      const selected = selectPair(await response.json() as unknown);
      if (selected === undefined) {
        return this.unavailable('The public quote source returned no valid liquid SEASON pair.');
      }

      const quote: SeasonUsdQuote = Object.freeze({
        ...selected,
        sourceUrl: this.endpoint,
        retrievedAt: this.now().toISOString(),
        freshness: 'fresh',
      });
      this.lastQuote = quote;
      return Object.freeze({ ok: true, quote });
    } catch (error) {
      const isAborted = error instanceof DOMException && error.name === 'AbortError';
      return this.unavailable(isAborted
        ? 'The public SEASON/USD quote timed out.'
        : 'The public SEASON/USD quote is currently unavailable.');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', forwardAbort);
    }
  }

  private unavailable(message: string): SeasonUsdQuoteResult {
    if (this.lastQuote !== undefined) {
      return Object.freeze({
        ok: true,
        quote: Object.freeze({ ...this.lastQuote, freshness: 'stale' }),
      });
    }

    return Object.freeze({ ok: false, message });
  }
}
