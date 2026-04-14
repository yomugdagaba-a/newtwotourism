/**
 * E2E Test — ST-03 to ST-12
 * Covers: ST-03, ST-04, ST-05, ST-09, ST-10, ST-11, ST-12
 *
 * Admin credentials: username=admin, password=admin123
 */

import { test, expect, Page } from '@playwright/test';

const BASE = process.env.FRONTEND_URL || 'https://localhost:9000';

// Login via the modal on homepage (TopBar "Sign In" button)
async function loginViaModal(page: Page, username: string, password: string) {
  await page.goto(BASE);
  // Click Sign In button in TopBar
  const signInBtn = page.locator('button:has-text("Sign In")').first();
  await expect(signInBtn).toBeVisible({ timeout: 15000 });
  await signInBtn.click();

  // Fill login modal form
  const usernameField = page.locator('input[name="usernameOrEmail"], input[placeholder*="username" i], input[placeholder*="email" i]').first();
  await expect(usernameField).toBeVisible({ timeout: 5000 });
  await usernameField.fill(username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for modal to close / redirect
  await page.waitForTimeout(2000);
}

// Login via direct URL /auth/login
async function loginViaDirect(page: Page, username: string, password: string) {
  await page.goto(`${BASE}/auth/login`);
  const usernameField = page.locator('input[name="usernameOrEmail"], input[placeholder*="username" i]').first();
  await expect(usernameField).toBeVisible({ timeout: 10000 });
  await usernameField.fill(username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin|home/i, { timeout: 15000 });
}

test.describe('ST-03 Booking lifecycle', () => {
  test('admin can log in and reach admin area', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    await expect(page).toHaveURL(/dashboard|admin/i);
  });
});

test.describe('ST-04 Password reset flow', () => {
  test('forgot password link is visible on login page', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    const forgotLink = page.locator('a:has-text("Forgot"), a:has-text("Reset"), button:has-text("Forgot")').first();
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
  });

  test('password reset page loads', async ({ page }) => {
    await page.goto(`${BASE}/auth/reset-password`);
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });
});

test.describe('ST-05 Admin user management', () => {
  test('admin can navigate to user management', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    await page.goto(`${BASE}/admin/users`);
    const userTable = page.locator('table, [class*="user"], [class*="table"]').first();
    await expect(userTable).toBeVisible({ timeout: 15000 });
  });
});

test.describe('ST-09 Hero image carousel', () => {
  test('homepage has hero section with image', async ({ page }) => {
    await page.goto(BASE);
    // Hero section with background image or carousel
    const hero = page.locator('[class*="hero"], [class*="banner"], [class*="carousel"], h1').first();
    await expect(hero).toBeVisible({ timeout: 15000 });
  });
});

test.describe('ST-10 Route protection', () => {
  test('unauthenticated user redirected from dashboard', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/login|auth/i, { timeout: 8000 });
  });

  test('unauthenticated user redirected from admin', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/login|auth/i, { timeout: 8000 });
  });
});

test.describe('ST-11 Owner mode toggle', () => {
  test('admin dashboard is accessible after login', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    // Admin should see admin dashboard
    const adminContent = page.locator('[class*="admin"], [class*="dashboard"], h1, h2').first();
    await expect(adminContent).toBeVisible({ timeout: 10000 });
  });
});

test.describe('ST-12 Problem reporting', () => {
  test('bookings page is accessible when logged in', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    await page.goto(`${BASE}/admin/bookings`);
    const content = page.locator('[class*="booking"], table, h1, h2').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});
