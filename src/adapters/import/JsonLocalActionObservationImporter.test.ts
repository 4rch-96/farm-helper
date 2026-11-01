import { describe, expect, it } from 'vitest';
import { JsonLocalActionObservationImporter } from './JsonLocalActionObservationImporter';

const BEFORE = 1_793_512_000_000;
const AFTER_HARVEST = BEFORE + 60_000;
const AFTER_PLANT = AFTER_HARVEST + 60_000;

function capture(input: Readonly<{
  now: number;
  energy: number;
  tokens: number;
  wheat?: number;
  crop?: string;
  cropCount?: number;
}>): string {
  return JSON.stringify({
    owner: 'private-wallet',
    fs_session: 'must-not-survive',
    now: input.now,
    farm: {
      version: 2,
      owner: 'private-wallet',
      name: 'private-farm',
      level: 4,
      tokens: input.tokens,
      today: { energy: input.energy },
      silo: { wheat: input.wheat ?? 0, corn: 0, feed: 0 },
      fields: Array.from({ length: input.cropCount ?? 0 }, (_, index) => ({ id: `private-field-${index}`, crop: input.crop })),
    },
  });
}

function receipt(message: string): string {
  return JSON.stringify({
    wallet: 'private-wallet',
    results: [{ ok: true, msg: message, gained: 0 }],
  });
}

describe('JsonLocalActionObservationImporter', () => {
  it('projects a harvest-to-silo batch without retaining source identities or receipt text', () => {
    const result = new JsonLocalActionObservationImporter().import({
      before: capture({ now: BEFORE, energy: 72, tokens: 100, wheat: 0, crop: 'wheat', cropCount: 24 }),
      after: capture({ now: AFTER_HARVEST, energy: 68, tokens: 100, wheat: 24 }),
      receipt: receipt('Wheat is in your silo.'),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.warnings).toEqual(['Credential-shaped fields were discarded. Revoke them before sharing a capture.']);
    expect(result.observation).toEqual(expect.objectContaining({
      kind: 'harvest-to-silo',
      scope: 'batch',
      item: 'wheat',
      quantity: 24,
      energyDelta: -4,
      tokenDelta: 0,
      siloDeltas: { wheat: 24 },
      fieldDeltas: { wheat: -24 },
    }));
    const persisted = JSON.stringify(result.observation);
    expect(persisted).not.toContain('private-wallet');
    expect(persisted).not.toContain('private-farm');
    expect(persisted).not.toContain('must-not-survive');
    expect(persisted).not.toContain('Wheat is in your silo');
  });

  it('projects a planted batch only from chronological compatible captures', () => {
    const importer = new JsonLocalActionObservationImporter();
    const result = importer.import({
      before: capture({ now: AFTER_HARVEST, energy: 68, tokens: 100, wheat: 24 }),
      after: capture({ now: AFTER_PLANT, energy: 66, tokens: 100, wheat: 24, crop: 'cauliflower', cropCount: 24 }),
      receipt: receipt('Cauliflower planted.'),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.observation).toEqual(expect.objectContaining({
      kind: 'plant',
      item: 'cauliflower',
      quantity: 24,
      energyDelta: -2,
      tokenDelta: 0,
      siloDeltas: {},
      fieldDeltas: { cauliflower: 24 },
    }));

    const unordered = importer.import({
      before: capture({ now: AFTER_PLANT, energy: 66, tokens: 100, wheat: 24, crop: 'cauliflower', cropCount: 24 }),
      after: capture({ now: AFTER_HARVEST, energy: 68, tokens: 100, wheat: 24 }),
      receipt: receipt('Cauliflower planted.'),
    });
    expect(unordered).toEqual(expect.objectContaining({ ok: false, message: 'After capture must be newer than before capture.' }));
  });
});
