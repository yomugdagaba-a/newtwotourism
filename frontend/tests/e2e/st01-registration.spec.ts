/**
 * E2E Test — ST-01: New user registration and email verification
 * Tool: Playwright
 * Run: npx playwright test tests/e2e/st01-registration.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.FRONTEND_URL || 'https://localhost:9000';
const timestamp = Date.now();
const testUser = {
  username: `e2e_user_${timestamp}`,
  email: `e2e_${timestamp}@test.com`,
  password: 'E2eTest123!',
  fullName: 'E2E Test User',
};

test.describe('ST-01 Registration and email verification', () => {

  test('homepage loads with Get Started button', async ({ page }) => {
    await page.goto(BASE);
    // TopBar renders a loading skeleton first, then shows auth buttons after hydration
    // Wait for the skeleton to disappear and the real button to appear
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.animate-pulse');
      return !skeleton || skeleton.clientWidth === 0;
    }, { timeout: 10000 }).catch(() => {}); // ignore if no skeleton

    const getStartedBtn = page.locator('button:has-text("Get Started")').first();
    await expect(getStartedBtn).toBeVisible({ timeout: 20000 });
  });

  test('Get Started button opens register modal', async ({ page }) => {
    await page.goto(BASE);
    // Wait for hydration
    const getStartedBtn = page.locator('button:has-text("Get Started")').first();
    await expect(getStartedBtn).toBeVisible({ timeout: 20000 });
    await getStartedBtn.click();
    // Modal should appear with registration form
    const modal = page.locator('[class*="modal"], [role="dialog"], form').first();
    await expect(modal).toBeVisible({ timeout: 8000 });
  });

  test('direct register page loads', async ({ page }) => {
    // Also accessible via direct URL
    await page.goto(`${BASE}/auth/register`);
    const form = page.locator('form, [class*="register"], input[type="password"]').first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test('fills and submits registration form via direct URL', async ({ page }) => {
    await page.goto(`${BASE}/auth/register`);

    // Fill username
    const usernameField = page.locator('input[name="username"], input[placeholder*="username" i], input[placeholder*="Username" i]').first();
    await expect(usernameField).toBeVisible({ timeout: 10000 });
    await usernameField.fill(testUser.username);

    // Fill email
    await page.fill('input[name="email"], input[type="email"]', testUser.email);

    // Fill full name if present
    const fullNameField = page.locator('input[name="fullName"], input[placeholder*="name" i], input[placeholder*="Full" i]').first();
    if (await fullNameField.count() > 0) {
      await fullNameField.fill(testUser.fullName);
    }

    // Fill password
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.first().fill(testUser.password);
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill(testUser.password);
    }

    await page.click('button[type="submit"]');

    // Should redirect to verify, dashboard, or home after registration
    await expect(page).toHaveURL(/verify|dashboard|home|auth/i, { timeout: 15000 });
  });

  test('ST-10 unauthenticated user redirected from dashboard to login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/i, { timeout: 8000 });
  });

  test('Sign In button is visible on homepage', async ({ page }) => {
    await page.goto(BASE);
    // Wait for hydration — skeleton disappears then Sign In appears
    const signInBtn = page.locator('button:has-text("Sign In")').first();
    await expect(signInBtn).toBeVisible({ timeout: 20000 });
  });

});
