import { describe, expect, it } from 'vitest';
import { JsonLocalGameCaptureImporter } from './JsonLocalGameCaptureImporter';

const CAPTURE_TIME = 1_793_491_200_000;

function safePayload(): Record<string, unknown> {
  return {
    now: CAPTURE_TIME,
    owner: 'private-wallet-address',
    farm: {
      version: 2,
      owner: 'private-wallet-address',
      name: 'private-farm-name',
      level: 4,
      today: { energy: 100 },
      animals: [
        ...Array.from({ length: 6 }, (_, index) => ({ id: `private-chicken-${index}`, kind: 'chicken' })),
        ...Array.from({ length: 3 }, (_, index) => ({ id: `private-cow-${index}`, kind: 'cow' })),
      ],
      structures: [{ id: 'private-coop', kind: 'coop' }, { id: 'private-barn', kind: 'barn' }],
      log: [
        { text: 'Collected egg (+27 SEASON)' },
        { text: 'Collected egg (+27 SEASON)' },
        { text: 'Collected milk (+109 SEASON)' },
        { text: 'Field 1: harvested chili (+18 SEASON)' },
        { text: 'Market: bought 20 feed bags from Other Player (−40 SEASON)' },
        { text: 'Private note that must not be retained' },
      ],
    },
    listings: [
      { id: 'private-listing', item: 'egg', qty: 10, price: 18, name: 'private-seller' },
      { id: 'other-listing', item: 'egg', qty: 5, price: 22, name: 'other-seller' },
      { id: 'feed-listing', item: 'feed', qty: 50, price: 26, name: 'other-seller' },
      { id: 'bread-listing', item: 'bread', qty: 2, price: 6, name: 'other-seller' },
    ],
  };
}

describe('JsonLocalGameCaptureImporter', () => {
  it('projects only source-backed planning facts and strips non-credential personal fields', () => {
    const result = new JsonLocalGameCaptureImporter().import(JSON.stringify(safePayload()));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.warnings).toEqual([]);
    expect(result.capture.farm).toEqual(expect.objectContaining({
      capturedAt: new Date(CAPTURE_TIME).toISOString(),
      townHallLevel: 4,
      energy: 100,
      animalCounts: { chicken: 6, cow: 3 },
      buildingCounts: { coop: 1, barn: 1 },
    }));
    expect(result.capture.directPayouts.egg.value).toBe(27);
    expect(result.capture.directPayouts.egg.unit).toBe('game-token');
    expect(result.capture.directPayouts.milk.value).toBe(109);
    expect(result.capture.directPayouts.chili.value).toBe(18);
    expect(result.capture.directUnitCosts.feed.value).toBe(2);
    expect(result.capture.market).toEqual(expect.objectContaining({
      priceUnitState: 'unit-validation-pending',
      aggregates: expect.arrayContaining([
        expect.objectContaining({ item: 'egg', activeListingCount: 2, totalQuantity: 15, medianPrice: 20 }),
      ]),
    }));

    const persistedProjection = JSON.stringify(result.capture);
    expect(persistedProjection).not.toContain('private-wallet-address');
    expect(persistedProjection).not.toContain('private-farm-name');
    expect(persistedProjection).not.toContain('private-chicken');
    expect(persistedProjection).not.toContain('private-seller');
    expect(persistedProjection).not.toContain('Private note');
  });

  it('rejects credential- and wallet-shaped input without returning a projection', () => {
    const raw = JSON.stringify({
      ...safePayload(),
      fs_session: 'must-not-survive-import',
      wallet: 'private-wallet-address',
    });
    const result = new JsonLocalGameCaptureImporter().import(raw);

    expect(result).toEqual({
      ok: false,
      message: 'Credential-shaped input is not accepted for local planning.',
      warnings: [],
    });
    expect(JSON.stringify(result)).not.toContain('must-not-survive-import');
    expect(JSON.stringify(result)).not.toContain('private-wallet-address');
  });

  it('rejects private URL and cURL material without returning a projection', () => {
    const privateUrl = new JsonLocalGameCaptureImporter().import(JSON.stringify({
      ...safePayload(),
      requestUrl: 'https://private.example.invalid/capture',
    }));
    const privateCurl = new JsonLocalGameCaptureImporter().import(JSON.stringify({
      ...safePayload(),
      farm: { ...safePayload().farm as Record<string, unknown>, debug: { curl: 'curl -H Authorization: secret' } },
    }));

    expect(privateUrl).toEqual({
      ok: false,
      message: 'Private URL- or cURL-shaped input is not accepted for local planning.',
      warnings: [],
    });
    expect(privateCurl).toEqual({
      ok: false,
      message: 'Private URL- or cURL-shaped input is not accepted for local planning.',
      warnings: [],
    });
    expect(JSON.stringify(privateUrl)).not.toContain('private.example.invalid');
    expect(JSON.stringify(privateCurl)).not.toContain('Authorization: secret');
  });

  it('rejects malformed captures without leaking the raw input', () => {
    const result = new JsonLocalGameCaptureImporter().import('{not-json');

    expect(result).toEqual({ ok: false, message: 'The capture is not valid JSON.', warnings: [] });
  });
});
