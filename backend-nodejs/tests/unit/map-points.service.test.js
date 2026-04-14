/**
 * Unit Tests — Map Points Service (Haversine distance)
 * Covers: UT-13, UT-14
 */

jest.mock('../../src/lib/prisma', () => ({
  mapPoint: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
}));

const mapPointsService = require('../../src/services/map-points.service');

// ── UT-13: Distance between identical coordinates = 0 ────────────────────────
test('UT-13 distance between identical coordinates is 0', () => {
  const dist = mapPointsService.calculateDistance(12.0316, 39.0472, 12.0316, 39.0472);
  expect(dist).toBe(0);
});

// ── UT-14: Distance between Addis Ababa and Lalibela ≈ 338 km ────────────────
test('UT-14 distance between Addis Ababa and Lalibela is approximately 338 km', () => {
  // Addis Ababa: 9.0054, 38.7636 | Lalibela: 12.0316, 39.0472
  // Actual Haversine result: ~337.9 km
  const dist = mapPointsService.calculateDistance(9.0054, 38.7636, 12.0316, 39.0472);
  // Allow ±20 km tolerance
  expect(dist).toBeGreaterThan(315);
  expect(dist).toBeLessThan(360);
});

// ── Additional distance sanity checks ────────────────────────────────────────
test('distance is symmetric (A→B equals B→A)', () => {
  const d1 = mapPointsService.calculateDistance(9.0, 38.7, 12.0, 39.0);
  const d2 = mapPointsService.calculateDistance(12.0, 39.0, 9.0, 38.7);
  expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
});

test('distance is always non-negative', () => {
  const dist = mapPointsService.calculateDistance(0, 0, 1, 1);
  expect(dist).toBeGreaterThanOrEqual(0);
});
