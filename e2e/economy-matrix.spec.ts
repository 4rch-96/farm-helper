import { expect, test } from '@playwright/test';

test('inspects documented evidence gaps for a Town Hall activity', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Town Hall level').selectOption('5');

  await expect(page.getByRole('table', { name: 'Global activities at Town Hall 5' })).toBeVisible();

  const cropActivity = page.getByRole('button', { name: 'Crop activity (evidence pending)' });
  await expect(cropActivity).toBeVisible();
  await cropActivity.click();

  await expect(page.getByRole('heading', { name: 'Crop activity (evidence pending)' })).toBeVisible();
  await expect(page.getByText('Formula unavailable until every required fact has admissible evidence. This activity is not ranked.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Named evidence gaps' })).toBeVisible();
});
