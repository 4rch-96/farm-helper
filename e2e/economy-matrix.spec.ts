import { expect, test } from '@playwright/test';

test('plans documented alternatives without presenting an unranked matrix', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Plan with the evidence you have.' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByText('Town Hall 6 and 7 are not presented as available.')).toBeVisible();

  await page.getByRole('tab', { name: /Animals/ }).click();
  await page.getByRole('button', { name: /Cow/ }).click();
  await expect(page.getByRole('complementary', { name: 'Cow evidence detail' })).toContainText(
    'This alternative is not compared at the selected Town Hall level.',
  );
  await expect(page.getByText('Town Hall 2 is required by the official guide')).toBeVisible();

  await page.getByLabel('Town Hall level').selectOption('3');
  await expect(page.getByLabel('Town Hall 3 official mechanics')).toBeVisible();

  await page.getByRole('tab', { name: /Processing/ }).click();
  await page.getByRole('button', { name: /Bread/ }).click();
  await expect(page.getByText('recipe inputs and quantities')).toBeVisible();
  await expect(page.getByText('unit-compatible output payout')).toBeVisible();
});
