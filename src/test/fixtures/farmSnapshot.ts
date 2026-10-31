export const supportedFarmSnapshot = {
  version: 2,
  importedAt: '2026-10-30T12:00:00.000Z',
  level: 4,
  energy: 86,
  dailyEarningLimit: 18,
  dailyEarnings: 7.5,
  inventory: { egg: 20, milk: 4 },
  silo: { wheat: 16, corn: 22, feed: 200 },
  animals: [
    { kind: 'chicken', count: 12, productReady: true },
    { kind: 'cow', count: 4, productReady: false },
  ],
};

export const unsupportedFarmSnapshot = {
  ...supportedFarmSnapshot,
  version: 999,
};

export const malformedFarmSnapshot = '{not-json';
