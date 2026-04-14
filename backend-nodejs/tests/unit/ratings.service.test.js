/**
 * Unit Tests — Ratings Service
 * Covers: UT-11, UT-12, FT-RT-07, FT-RT-08
 */

jest.mock('../../src/lib/prisma', () => ({
  tourismRating: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn() },
  hotelRating:   { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn() },
  tourismPlace:  { findUnique: jest.fn() },
  hotel:         { findUnique: jest.fn() },
}));

const prisma = require('../../src/lib/prisma');
const ratingsService = require('../../src/services/ratings.service');

beforeEach(() => jest.clearAllMocks());

// ── UT-11: Rating value of 6 → error ─────────────────────────────────────────
test('UT-11 throws when rating is 6 (above max)', async () => {
  await expect(ratingsService.rateTourism(1, 1, 6, 'comment'))
    .rejects.toMatchObject({ status: 400 });
});

// ── UT-12: Rating value of 0 → error ─────────────────────────────────────────
test('UT-12 throws when rating is 0 (below min)', async () => {
  await expect(ratingsService.rateTourism(1, 1, 0, 'comment'))
    .rejects.toMatchObject({ status: 400 });
});

// ── FT-RT-07: Rating value of -1 → error ─────────────────────────────────────
test('FT-RT-07 throws when rating is negative', async () => {
  await expect(ratingsService.rateTourism(1, 1, -1, 'comment'))
    .rejects.toMatchObject({ status: 400 });
});

// ── FT-RT-08: Upsert — second rating updates existing ────────────────────────
test('FT-RT-08 upsert updates existing rating instead of creating duplicate', async () => {
  prisma.tourismPlace.findUnique.mockResolvedValue({ id: 1, name: 'Test Place' });
  prisma.tourismRating.upsert.mockResolvedValue({ id: 1, tourismPlaceId: 1, userId: 1, rating: 4, comment: 'Updated' });

  const result = await ratingsService.rateTourism(1, 1, 4, 'Updated');
  expect(prisma.tourismRating.upsert).toHaveBeenCalledTimes(1);
  expect(result.rating).toBe(4);
});

// ── Valid rating 1–5 succeeds ─────────────────────────────────────────────────
test.each([1, 2, 3, 4, 5])('rating value %i is valid', async (rating) => {
  prisma.tourismPlace.findUnique.mockResolvedValue({ id: 1, name: 'Test Place' });
  prisma.tourismRating.upsert.mockResolvedValue({ id: 1, tourismPlaceId: 1, userId: 1, rating });
  await expect(ratingsService.rateTourism(1, 1, rating, '')).resolves.toBeDefined();
});

// ── TC-RT-05: Hotel rating range validation ───────────────────────────────────
test('TC-RT-05 throws when hotel rating is 6', async () => {
  await expect(ratingsService.rateHotel(1, 1, 6, 'comment'))
    .rejects.toMatchObject({ status: 400 });
});

test('TC-RT-05 throws when hotel rating is 0', async () => {
  await expect(ratingsService.rateHotel(1, 1, 0, 'comment'))
    .rejects.toMatchObject({ status: 400 });
});

test('TC-RT-05 hotel rating upsert works for valid value', async () => {
  prisma.hotel.findUnique.mockResolvedValue({ id: 1, name: 'Test Hotel' });
  prisma.hotelRating.upsert.mockResolvedValue({ id: 1, hotelId: 1, userId: 1, rating: 3 });
  const result = await ratingsService.rateHotel(1, 1, 3, 'Good');
  expect(result.rating).toBe(3);
});
