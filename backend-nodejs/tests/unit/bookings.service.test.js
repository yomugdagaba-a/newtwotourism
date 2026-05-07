/**
 * Unit Tests — Booking Service (State Machine)
 * Covers: UT-08 to UT-10, TC-BKG-09, TC-BKG-10
 */

jest.mock('../../src/lib/prisma', () => ({
  hotelBooking: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  bookingStatusEntity: { findUnique: jest.fn(), create: jest.fn() },
  bookingMessage: { create: jest.fn() },
  user: { findUnique: jest.fn() },
}));

jest.mock('../../src/services/email-gmail.service', () => ({
  sendBookingAcceptedNotification: jest.fn().mockResolvedValue(true),
  sendCostProposedNotification: jest.fn().mockResolvedValue(true),
  sendReceiptUploadedNotification: jest.fn().mockResolvedValue(true),
  sendBookingApprovedNotification: jest.fn().mockResolvedValue(true),
  sendBookingRejectedNotification: jest.fn().mockResolvedValue(true),
}));

const prisma = require('../../src/lib/prisma');
const bookingsService = require('../../src/services/bookings.service');

beforeEach(() => jest.clearAllMocks());

function mockBooking(statusName, ownerId = 10) {
  return {
    id: 1, hotelId: 1, userId: 5, statusId: 99,
    hotel: { id: 1, name: 'Test Hotel', ownerId, owner: { fullName: 'Owner' } },
    user: { id: 5, fullName: 'Client', email: 'client@test.com' },
    status: { name: statusName },
    messages: [],
    checkIn: new Date(), checkOut: new Date(),
    numberOfGuests: 2, totalCost: null, receiptImageUrl: null,
    rejectionReason: null, problemReport: null, problemReported: false,
  };
}

function mockStatus(name) {
  return { id: 99, name };
}

// ── UT-08: Accept booking already in OWNER_ACCEPTED ───────────────────────────
test('UT-08 cannot accept booking already in OWNER_ACCEPTED status', async () => {
  const booking = mockBooking('OWNER_ACCEPTED', 10);
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);
  prisma.bookingStatusEntity.findUnique.mockResolvedValue(mockStatus('OWNER_ACCEPTED'));

  await expect(bookingsService.acceptRequest(1, 10))
    .rejects.toMatchObject({ status: 400 });
});

// ── UT-09: Upload receipt when status is COST_PROPOSED ───────────────────────
test('UT-09 upload receipt transitions to PAID when status is COST_PROPOSED', async () => {
  const booking = mockBooking('COST_PROPOSED', 10);
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);
  prisma.bookingStatusEntity.findUnique.mockResolvedValue(mockStatus('COST_PROPOSED'));
  prisma.bookingStatusEntity.create.mockResolvedValue(mockStatus('PAID'));
  prisma.hotelBooking.update.mockResolvedValue({ ...booking, status: { name: 'PAID' }, messages: [] });
  prisma.bookingMessage.create.mockResolvedValue({});
  prisma.user.findUnique.mockResolvedValue({ id: 10, email: 'owner@test.com' });

  const result = await bookingsService.uploadReceipt(1, 'https://example.com/receipt.jpg', 5);
  expect(result.bookingStatus).toBe('PAID');
});

// ── UT-10: Approve booking when status is REQUESTED (invalid) ─────────────────
test('UT-10 cannot approve booking in REQUESTED status', async () => {
  const booking = mockBooking('REQUESTED', 10);
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);
  prisma.bookingStatusEntity.findUnique.mockResolvedValue(mockStatus('REQUESTED'));

  await expect(bookingsService.approveBooking(1, 10))
    .rejects.toMatchObject({ status: 400 });
});

// ── TC-BKG-09: Invalid state transition ──────────────────────────────────────
test('TC-BKG-09 cannot accept booking in APPROVED status', async () => {
  const booking = mockBooking('APPROVED', 10);
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);
  prisma.bookingStatusEntity.findUnique.mockResolvedValue(mockStatus('APPROVED'));

  await expect(bookingsService.acceptRequest(1, 10))
    .rejects.toMatchObject({ status: 400 });
});

// ── TC-BKG-10: Non-owner cannot accept ───────────────────────────────────────
test('TC-BKG-10 non-owner cannot accept booking', async () => {
  const booking = mockBooking('REQUESTED', 10); // owner is 10
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);

  await expect(bookingsService.acceptRequest(1, 99)) // different user
    .rejects.toMatchObject({ status: 403 });
});

// ── Full lifecycle: REQUESTED → OWNER_ACCEPTED ───────────────────────────────
test('acceptRequest transitions REQUESTED → OWNER_ACCEPTED', async () => {
  const booking = mockBooking('REQUESTED', 10);
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);
  prisma.bookingStatusEntity.findUnique.mockResolvedValue(mockStatus('REQUESTED'));
  prisma.bookingStatusEntity.create.mockResolvedValue(mockStatus('OWNER_ACCEPTED'));
  prisma.hotelBooking.update.mockResolvedValue({ ...booking, status: { name: 'OWNER_ACCEPTED' }, messages: [] });
  prisma.bookingMessage.create.mockResolvedValue({});

  const result = await bookingsService.acceptRequest(1, 10);
  expect(result.bookingStatus).toBe('OWNER_ACCEPTED');
});

// ── Cannot upload receipt when not in COST_PROPOSED ──────────────────────────
test('uploadReceipt throws 400 when status is REQUESTED', async () => {
  const booking = mockBooking('REQUESTED', 10);
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);
  prisma.bookingStatusEntity.findUnique.mockResolvedValue(mockStatus('REQUESTED'));

  await expect(bookingsService.uploadReceipt(1, 'https://example.com/r.jpg', 5))
    .rejects.toMatchObject({ status: 400 });
});

// ── Non-client cannot upload receipt ─────────────────────────────────────────
test('uploadReceipt throws 403 when userId does not match booking userId', async () => {
  const booking = mockBooking('COST_PROPOSED', 10);
  prisma.hotelBooking.findUnique.mockResolvedValue(booking);

  await expect(bookingsService.uploadReceipt(1, 'https://example.com/r.jpg', 999))
    .rejects.toMatchObject({ status: 403 });
});
