import { expect, test } from '@playwright/test';

test('imports a snapshot and shows read-only guidance', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Paste snapshot JSON').fill(JSON.stringify({ farm: { version: 2, level: 4, today: { energy: 86 }, silo: { wheat: 16, corn: 22, feed: 200 }, goods: {}, pantry: {}, keep: {}, animals: [] } }));
  await page.getByRole('button', { name: 'ANALYZE SNAPSHOT' }).click();
  await expect(page.getByText('RANKED BY EFFECTIVE HOURLY NET PROFIT')).toBeVisible();
  await expect(page.getByText(/live player-market listings and liquidity are not included/i)).toBeVisible();
});
