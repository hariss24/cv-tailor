import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check that the login form is present
    await expect(page.locator('h1')).toHaveText('Accès restreint');
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Since we don't have REMOTE_AUTH_PASSWORD set in the global test environment,
    // the API will return success immediately, but we can at least test the UI flow.
    await page.fill('input[type="password"]', 'any-password');
    await page.click('button[type="submit"]');
    
    // It should redirect or show success (since no auth is required in test env)
    // Actually, in our code, if res.ok, it does `window.location.href = "/"`
    await page.waitForURL('**/');
    expect(page.url()).not.toContain('/login');
  });
});
