import { describe, expect, it } from 'vitest';
import { JsonFarmSnapshotImporter } from './JsonFarmSnapshotImporter';

const validGameSnapshot = {
  now: 1793405864698,
  farm: {
    version: 2,
    level: 4,
    today: { energy: 86, harvestEarned: 7.5 },
    goods: { oil: 260, gold: 94.5 },
    pantry: { flour: 21 },
    silo: { wheat: 16, corn: 22, feed: 200 },
    animals: [
      { kind: 'chicken', productReady: true },
      { kind: 'chicken', productReady: false },
      { kind: 'cow', productReady: false },
    ],
  },
};

describe('JsonFarmSnapshotImporter', () => {
  it('normalizes a supported game snapshot in browser-local memory', () => {
    const result = new JsonFarmSnapshotImporter().import(JSON.stringify(validGameSnapshot));

    expect(result).toMatchObject({ ok: true, warnings: [] });
    if (result.ok) {
      expect(result.snapshot).toMatchObject({
        version: 2,
        level: 4,
        energy: 86,
        inventory: { oil: 260, gold: 94.5, flour: 21 },
        silo: { wheat: 16, corn: 22, feed: 200 },
      });
      expect(result.snapshot.animals).toEqual([
        { kind: 'chicken', count: 2, productReady: true },
        { kind: 'cow', count: 1, productReady: false },
      ]);
    }
  });

  it('rejects malformed JSON and unsupported schema versions', () => {
    const importer = new JsonFarmSnapshotImporter();

    expect(importer.import('{bad-json')).toMatchObject({ ok: false, message: 'The selected file is not valid JSON.' });
    expect(importer.import(JSON.stringify({ ...validGameSnapshot, farm: { ...validGameSnapshot.farm, version: 3 } }))).toMatchObject({
      ok: false,
      message: 'Snapshot version 3 is not supported.',
    });
  });

  it('redacts credential-shaped fields from normalized data and diagnostics', () => {
    const secret = 'do-not-expose-this-session';
    const result = new JsonFarmSnapshotImporter().import(JSON.stringify({ ...validGameSnapshot, fs_session: secret }));

    expect(result).toMatchObject({ ok: true });
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(result.warnings.join(' ')).toContain('credential-shaped');
  });

  it('rejects snapshots missing analysis inputs', () => {
    const result = new JsonFarmSnapshotImporter().import(JSON.stringify({ farm: { version: 2, level: 4, today: { energy: 50 } } }));

    expect(result).toMatchObject({ ok: false, message: expect.stringContaining('silo') });
  });
});
