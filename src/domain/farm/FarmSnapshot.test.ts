import { describe, expect, it } from 'vitest';
import { createFarmSnapshot, FarmSnapshotValidationError, isActivityUnlocked, remainingDailyEarningCapacity } from './FarmSnapshot';
import { supportedFarmSnapshot } from '../../test/fixtures/farmSnapshot';

describe('FarmSnapshot', () => {
  it('normalizes calculation-relevant farm state', () => {
    const snapshot = createFarmSnapshot(supportedFarmSnapshot);

    expect(snapshot.level).toBe(4);
    expect(snapshot.energy).toBe(86);
    expect(snapshot.silo.feed).toBe(200);
    expect(snapshot.animals).toHaveLength(2);
    expect(remainingDailyEarningCapacity(snapshot)).toBe(10.5);
  });

  it('enforces valid levels and non-negative values', () => {
    expect(() => createFarmSnapshot({ ...supportedFarmSnapshot, level: 0 })).toThrow(FarmSnapshotValidationError);
    expect(() => createFarmSnapshot({ ...supportedFarmSnapshot, energy: -1 })).toThrow('Energy must be a non-negative finite number.');
  });

  it('reports unlock eligibility without inventing activity data', () => {
    const snapshot = createFarmSnapshot(supportedFarmSnapshot);

    expect(isActivityUnlocked(snapshot, 3)).toBe(true);
    expect(isActivityUnlocked(snapshot, 5)).toBe(false);
  });
});
