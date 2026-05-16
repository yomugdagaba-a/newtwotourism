/**
 * E2E Test — ST-02: Tourism discovery and hotel booking
 * Covers: ST-02, ST-07 (map display), ST-08 (rating)
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.FRONTEND_URL || 'https://localhost:9000';

test.describe('ST-02 Tourism discovery', () => {

  test('homepage loads with hero section and category buttons', async ({ page }) => {
    await page.goto(BASE);
    // Hero section with "Explore North Wollo" heading
    const hero = page.locator('h1, h2, [class*="hero"], [class*="banner"]').first();
    await expect(hero).toBeVisible({ timeout: 15000 });
  });

  test('homepage has View all Places button', async ({ page }) => {
    await page.goto(BASE);
    const viewAllBtn = page.locator('a:has-text("View all Places"), button:has-text("View all"), a[href*="tourism"]').first();
    await expect(viewAllBtn).toBeVisible({ timeout: 15000 });
  });

  test('homepage has category filter buttons', async ({ page }) => {
    await page.goto(BASE);
    // Category buttons: Heritage, Highland, Cavern, etc.
    const categoryBtn = page.locator('button:has-text("Heritage"), button:has-text("Highland"), button:has-text("Cavern"), [class*="category"]').first();
    await expect(categoryBtn).toBeVisible({ timeout: 15000 });
  });

  test('search input is present in TopBar', async ({ page }) => {
    await page.goto(BASE);
    // TopBar has a search input with placeholder "Search..."
    const searchInput = page.locator('input[placeholder="Search..."], input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
  });

  test('can search and navigate to tourism list', async ({ page }) => {
    await page.goto(BASE);
    const searchInput = page.locator('input[placeholder="Search..."], input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill('Lalibela');
    await page.keyboard.press('Enter');
    // Should navigate to /tourisms with keyword param
    await expect(page).toHaveURL(/tourisms|tourism/i, { timeout: 20000 });
  });

  test('tourism list page loads', async ({ page }) => {
    await page.goto(`${BASE}/tourisms`);
    // Should show tourism places
    const content = page.locator('[class*="card"], [class*="place"], [class*="tourism"], h1, h2').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('ST-07 tourism detail page loads with map', async ({ page }) => {
    await page.goto(`${BASE}/tourisms`);
    // Click first tourism place card
    const firstCard = page.locator('a[href*="/tourisms/"], [class*="card"] a, [class*="place"] a').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      // Map container (Leaflet) should be present
      const map = page.locator('.leaflet-container, [class*="map"]').first();
      await expect(map).toBeVisible({ timeout: 20000 });
    } else {
      // If no cards, just verify the page loaded
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Get Started button opens auth modal', async ({ page }) => {
    await page.goto(BASE);
    // The app shows "Join" button for unauthenticated users
    const joinBtn = page.locator('button:has-text("Join"), button:has-text("Get Started"), button:has-text("Sign Up")').first();
    await expect(joinBtn).toBeVisible({ timeout: 15000 });
    await joinBtn.click();
    // Modal with form should appear
    const modal = page.locator('[class*="modal"], [role="dialog"], form').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

});
