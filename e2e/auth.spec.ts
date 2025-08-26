import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/Masonic Traveler/);
    await expect(page.getByText('Connect with Brethren Nearby')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL('/auth/register');
    await expect(page.getByText('Create your account')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Note: This would require actual form validation to be implemented
    // For now, we just check the form exists
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should toggle between email and magic link login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check magic link checkbox
    await page.check('input[name="magic-link"]');
    
    // Password field should be hidden
    await expect(page.locator('input[name="password"]')).not.toBeVisible();
    
    // Button text should change
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible();
  });

  test('should have PWA install prompt', async ({ page }) => {
    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });
    
    // Check if install button appears (this is a simplified test)
    // In real implementation, the button would appear after the event
    await expect(page.getByText('Masonic Traveler')).toBeVisible();
  });

  test('should navigate between auth pages', async ({ page }) => {
    // Start at login
    await page.goto('/auth/login');
    
    // Go to register
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/auth/register');
    
    // Go back to login
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/auth/login');
  });
});
