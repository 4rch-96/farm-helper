import { describe, expect, it } from 'vitest';
import { FarmingSeasonPublicContextClient } from './FarmingSeasonPublicContextClient';

const now = () => new Date('2026-10-30T12:00:00.000Z');

describe('FarmingSeasonPublicContextClient', () => {
  it('normalizes an anonymous valid payload without credentials', async () => {
    let request: RequestInit | undefined;
    const client = new FarmingSeasonPublicContextClient({
      now,
      fetcher: async (_url, init) => {
        request = init;
        return new Response(JSON.stringify({ prices: { gold: 42.5, oil: 8 }, updatedAt: now().toISOString() }), { status: 200 });
      },
    });

    await expect(client.getContext()).resolves.toMatchObject({
      ok: true,
      context: { freshness: 'fresh', prices: { gold: 42.5, oil: 8 } },
    });
    expect(request?.credentials).toBe('omit');
  });

  it('rejects authentication challenges and invalid payloads', async () => {
    const authenticated = new FarmingSeasonPublicContextClient({ fetcher: async () => new Response('', { status: 401 }) });
    const invalid = new FarmingSeasonPublicContextClient({ fetcher: async () => new Response(JSON.stringify({ prices: { gold: 'wrong' } }), { status: 200 }) });

    await expect(authenticated.getContext()).resolves.toMatchObject({ ok: false, message: expect.stringContaining('authentication') });
    await expect(invalid.getContext()).resolves.toMatchObject({ ok: false, message: expect.stringContaining('valid prices') });
  });

  it('marks old values stale and degrades on a timeout', async () => {
    const stale = new FarmingSeasonPublicContextClient({
      now,
      fetcher: async () => new Response(JSON.stringify({ prices: { silver: 12 }, updatedAt: '2026-10-30T11:00:00.000Z' }), { status: 200 }),
    });
    const timedOut = new FarmingSeasonPublicContextClient({
      timeoutMs: 1,
      fetcher: async (_url, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))),
    });

    await expect(stale.getContext()).resolves.toMatchObject({ ok: true, context: { freshness: 'stale' } });
    await expect(timedOut.getContext()).resolves.toMatchObject({ ok: false, message: 'Public context request timed out.' });
  });
});
