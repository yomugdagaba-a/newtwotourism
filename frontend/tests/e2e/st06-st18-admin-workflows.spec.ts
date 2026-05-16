/**
 * E2E Tests — ST-06 to ST-18 (Admin and advanced workflows)
 */

import { test, expect, Page } from '@playwright/test';

const BASE = process.env.FRONTEND_URL || 'https://localhost:9000';

async function loginViaDirect(page: Page, username: string, password: string) {
  await page.goto(`${BASE}/auth/login`);
  const usernameField = page.locator('input[name="usernameOrEmail"], input[placeholder*="username" i]').first();
  await expect(usernameField).toBeVisible({ timeout: 10000 });
  await usernameField.fill(username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin|home|localhost:9000\/?$/i, { timeout: 25000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

async function loginAndGoTo(page: Page, username: string, password: string, targetPath: string) {
  // Step 1: Login and capture the tokens stored in localStorage
  await loginViaDirect(page, username, password);

  // Step 2: Read auth data from localStorage after successful login
  const authData = await page.evaluate(() => ({
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    userId: localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
  }));

  // Step 3: Pre-inject localStorage into the new page context before navigation
  await page.addInitScript((data) => {
    if (data.token) localStorage.setItem('token', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.userId) localStorage.setItem('userId', data.userId);
    if (data.username) localStorage.setItem('username', data.username);
    if (data.role) localStorage.setItem('role', data.role);
  }, authData);

  // Step 4: Navigate to the target admin page — localStorage is pre-populated
  await page.goto(`${BASE}${targetPath}`);
  await page.waitForLoadState('networkidle');
}

// ── ST-06: Hotel owner assignment ─────────────────────────────────────────────
test.describe('ST-06 Hotel owner assignment', () => {
  test('admin can navigate to hotel management', async ({ page }) => {
    await loginAndGoTo(page, 'admin', 'admin123', '/admin/hotels');
    // Page shows hotel cards with h3 headings and "Add Hotel" button
    const content = page.locator('h3, button:has-text("Add Hotel"), button:has-text("Hotel")').first();
    await expect(content).toBeVisible({ timeout: 25000 });
  });
});

// ── ST-07b: Road coordinates on map ──────────────────────────────────────────
test.describe('ST-07b Road coordinates on map', () => {
  test('tourism detail page renders Leaflet map', async ({ page }) => {
    await page.goto(`${BASE}/tourisms`);
    // Click first tourism place
    const firstCard = page.locator('a[href*="/tourisms/"]').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      const map = page.locator('.leaflet-container').first();
      await expect(map).toBeVisible({ timeout: 20000 });
    }
  });
});

// ── ST-08: Rating submission and summary ─────────────────────────────────────
test.describe('ST-08 Rating submission', () => {
  test('tourism detail page has rating section', async ({ page }) => {
    await page.goto(`${BASE}/tourisms`);
    const firstCard = page.locator('a[href*="/tourisms/"]').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      // Rating section — stars or review count
      const ratingSection = page.locator('[class*="rating"], [class*="review"], [class*="star"]').first();
      await expect(ratingSection).toBeVisible({ timeout: 15000 });
    }
  });
});

// ── ST-13: Admin creates road and horse service ───────────────────────────────
test.describe('ST-13 Admin road and horse service', () => {
  test('admin dashboard loads', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    const dashboard = page.locator('[class*="dashboard"], [class*="admin"], h1, h2').first();
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });

  test('admin tourism management page loads', async ({ page }) => {
    await loginAndGoTo(page, 'admin', 'admin123', '/admin/tourisms');
    const content = page.locator('h3, button:has-text("Add"), button:has-text("Tourism")').first();
    await expect(content).toBeVisible({ timeout: 25000 });
  });
});

// ── ST-14: Admin creates language guider ─────────────────────────────────────
test.describe('ST-14 Admin language guider', () => {
  test('admin guider management page loads', async ({ page }) => {
    await loginAndGoTo(page, 'admin', 'admin123', '/admin/guiders');
    const content = page.locator('h3, button:has-text("Add"), select, input').first();
    await expect(content).toBeVisible({ timeout: 25000 });
  });

  test('new guider form opens via Add Guider button', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    await page.goto(`${BASE}/admin/guiders`);
    await page.waitForLoadState('networkidle');
    // The guiders page has an "Add Guider" button that opens a modal
    // First select a tourism place if needed
    const select = page.locator('select').first();
    if (await select.count() > 0) {
      const options = await select.locator('option').count();
      if (options > 1) {
        await select.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }
    }
    const addBtn = page.locator('button:has-text("Add Guider")').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    // Modal with form should appear
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 8000 });
  });
});

// ── ST-15: Map point creation and display ────────────────────────────────────
test.describe('ST-15 Map point creation', () => {
  test('tourism detail page shows map for map points', async ({ page }) => {
    await page.goto(`${BASE}/tourisms`);
    const firstCard = page.locator('a[href*="/tourisms/"]').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      const map = page.locator('.leaflet-container').first();
      await expect(map).toBeVisible({ timeout: 20000 });
    }
  });
});

// ── ST-16: Hotel image gallery management ────────────────────────────────────
test.describe('ST-16 Hotel image gallery', () => {
  test('admin hotel detail page loads', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    await page.goto(`${BASE}/admin/hotels`);
    const firstHotel = page.locator('a[href*="/admin/hotels/"], table tbody tr a').first();
    if (await firstHotel.count() > 0) {
      await firstHotel.click();
      const content = page.locator('[class*="hotel"], [class*="image"], img, h1').first();
      await expect(content).toBeVisible({ timeout: 15000 });
    }
  });
});

// ── ST-17: Tourism place image gallery management ────────────────────────────
test.describe('ST-17 Tourism place image gallery', () => {
  test('admin tourism detail page loads', async ({ page }) => {
    await loginViaDirect(page, 'admin', 'admin123');
    await page.goto(`${BASE}/admin/tourisms`);
    const firstPlace = page.locator('a[href*="/admin/tourisms/"], table tbody tr a').first();
    if (await firstPlace.count() > 0) {
      await firstPlace.click();
      const content = page.locator('[class*="tourism"], [class*="image"], img, h1').first();
      await expect(content).toBeVisible({ timeout: 15000 });
    }
  });
});

// ── ST-18: Client views hotel detail and rates hotel ─────────────────────────
test.describe('ST-18 Client hotel rating', () => {
  test('hotel list page is accessible', async ({ page }) => {
    await page.goto(`${BASE}/hotels`);
    const content = page.locator('[class*="hotel"], [class*="card"], h1, h2').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('hotel detail page shows rating section', async ({ page }) => {
    await page.goto(`${BASE}/hotels`);
    const firstHotel = page.locator('a[href*="/hotels/"]').first();
    if (await firstHotel.count() > 0) {
      await firstHotel.click();
      const ratingSection = page.locator('[class*="rating"], [class*="review"], [class*="star"]').first();
      await expect(ratingSection).toBeVisible({ timeout: 15000 });
    }
  });
});

// ── ST-09 Hero image carousel (admin management) ─────────────────────────────
test.describe('ST-09 Hero image carousel admin', () => {
  test('admin hero images page loads', async ({ page }) => {
    await loginAndGoTo(page, 'admin', 'admin123', '/admin/hero-images');
    const content = page.locator('h3, button:has-text("Add"), img, input').first();
    await expect(content).toBeVisible({ timeout: 25000 });
  });
});
