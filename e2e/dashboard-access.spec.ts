import { test, expect } from '@playwright/test';

test.describe('Dashboard Access Control', () => {
  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('shows verification guidance for direct access', async ({ page }) => {
    await page.goto('/verification/required');
    await expect(page.getByRole('heading', { name: 'Verification Required' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Secretary Verification/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Vouch Verification/i })).toBeVisible();
  });
});
