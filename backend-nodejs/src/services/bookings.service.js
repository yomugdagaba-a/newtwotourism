const prisma = require('../lib/prisma');
const emailService = require('./email.service');

const INCLUDE = {
  hotel: { include: { owner: true } },
  user: true,
  status: true,
  messages: { include: { user: true }, orderBy: { createdAt: 'asc' } },
};

function formatDate(dt) {
  if (!dt) return null;
  // Return YYYY-MM-DD if it's a full ISO datetime, otherwise as-is
  const s = dt instanceof Date ? dt.toISOString() : String(dt);
  return s.length > 10 ? s.substring(0, 10) : s;
}

function transform(b) {
  if (!b) return b;
  return {
    ...b,
    bookingId: b.id,
    bookingStatus: b.status?.name || 'UNKNOWN',
    checkIn: formatDate(b.checkIn),
    checkOut: formatDate(b.checkOut),
    totalCost: b.totalCost ? parseFloat(b.totalCost.toString()) : null,
    hotel: {
      id: b.hotel?.id,
      name: b.hotel?.name,
      contactInfo: b.hotel?.contactInfo,
      active: b.hotel?.active,
      ownerId: b.hotel?.ownerId,
      ownerName: b.hotel?.owner?.fullName || b.hotel?.owner?.username || null,
    },
    client: {
      id: b.user?.id,
      fullName: b.user?.fullName,
      username: b.user?.username,
      email: b.user?.email,
      phone: b.clientPhone,
    },
    messages: (b.messages || []).map(m => ({
      id: m.id,
      senderId: m.userId,
      senderName: m.user?.fullName || m.user?.username || 'Unknown',
      message: m.message,
      messageType: m.isFromOwner ? 'OWNER' : 'GENERAL',
      isRead: false,
      createdAt: m.createdAt,
    })),
  };
}

async function getOrCreateStatus(name) {
  let s = await prisma.bookingStatusEntity.findUnique({ where: { name } });
  if (!s) s = await prisma.bookingStatusEntity.create({ data: { name } });
  return s;
}

async function addMessage(bookingId, userId, message, isFromOwner) {
  await prisma.bookingMessage.create({ data: { bookingId, userId, message, isFromOwner } });
  return prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: INCLUDE });
}

async function create(data, userId) {
  const status = await getOrCreateStatus('REQUESTED');

  // Coerce date-only strings (YYYY-MM-DD) to ISO DateTime
  const checkIn = data.checkIn && data.checkIn.length === 10 ? `${data.checkIn}T00:00:00Z` : data.checkIn;
  const checkOut = data.checkOut && data.checkOut.length === 10 ? `${data.checkOut}T00:00:00Z` : data.checkOut;

  // Only pass known Prisma fields — never spread unknown keys
  const booking = await prisma.hotelBooking.create({
    data: {
      hotelId: parseInt(data.hotelId),
      userId,
      statusId: status.id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      numberOfGuests: parseInt(data.numberOfGuests),
      numberOfRooms: data.numberOfRooms ? parseInt(data.numberOfRooms) : null,
      specialRequests: data.specialRequests || null,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      totalCost: data.totalCost ? parseFloat(data.totalCost) : null,
      receiptImageUrl: data.receiptImageUrl || null,
      rejectionReason: data.rejectionReason || null,
      problemReport: data.problemReport || null,
      problemReported: data.problemReported || false,
    },
    include: INCLUDE,
  });
  return transform(booking);
}

async function findAll(skip = 0, take = 10, hotelId, userId) {
  const where = {};
  if (hotelId) where.hotelId = parseInt(hotelId);
  if (userId) where.userId = parseInt(userId);
  const [bookings, total] = await Promise.all([
    prisma.hotelBooking.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE }),
    prisma.hotelBooking.count({ where }),
  ]);
  return { bookings: bookings.map(transform), total };
}

async function findById(id) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id }, include: INCLUDE });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  return transform(booking);
}

async function update(id, data) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });

  // Build safe update object — only known Prisma fields
  const updateData = {};
  if (data.checkIn !== undefined) updateData.checkIn = new Date(data.checkIn.length === 10 ? `${data.checkIn}T00:00:00Z` : data.checkIn);
  if (data.checkOut !== undefined) updateData.checkOut = new Date(data.checkOut.length === 10 ? `${data.checkOut}T00:00:00Z` : data.checkOut);
  if (data.numberOfGuests !== undefined) updateData.numberOfGuests = parseInt(data.numberOfGuests);
  if (data.numberOfRooms !== undefined) updateData.numberOfRooms = data.numberOfRooms ? parseInt(data.numberOfRooms) : null;
  if (data.specialRequests !== undefined) updateData.specialRequests = data.specialRequests;
  if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone;
  if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
  if (data.totalCost !== undefined) updateData.totalCost = data.totalCost ? parseFloat(data.totalCost) : null;
  if (data.receiptImageUrl !== undefined) updateData.receiptImageUrl = data.receiptImageUrl;
  if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
  if (data.problemReport !== undefined) updateData.problemReport = data.problemReport;
  if (data.problemReported !== undefined) updateData.problemReported = data.problemReported;

  const updated = await prisma.hotelBooking.update({ where: { id }, data: updateData, include: INCLUDE });
  return transform(updated);
}

async function updateStatus(id, statusName) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  const status = await getOrCreateStatus(statusName);
  const updated = await prisma.hotelBooking.update({ where: { id }, data: { statusId: status.id }, include: INCLUDE });
  return transform(updated);
}

async function remove(id) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  return prisma.hotelBooking.delete({ where: { id } });
}

async function getByUser(userId, skip = 0, take = 100) {
  const bookings = await prisma.hotelBooking.findMany({
    where: { userId },
    skip: parseInt(skip),
    take: parseInt(take),
    include: INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return bookings.map(transform);
}

async function getByHotel(hotelId, skip = 0, take = 10) {
  const bookings = await prisma.hotelBooking.findMany({
    where: { hotelId },
    skip: parseInt(skip),
    take: parseInt(take),
    include: INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return bookings.map(transform);
}

async function getByOwner(ownerId) {
  const bookings = await prisma.hotelBooking.findMany({
    where: { hotel: { ownerId } },
    include: INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return bookings.map(transform);
}

async function acceptRequest(bookingId, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });

  // Validate current status is REQUESTED
  const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
  if (!currentStatus || currentStatus.name !== 'REQUESTED') {
    throw Object.assign(new Error(`Cannot accept booking in ${currentStatus?.name || 'unknown'} status`), { status: 400 });
  }

  const status = await getOrCreateStatus('OWNER_ACCEPTED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, ownerId, 'Request accepted', true);
  if (booking.user.email) {
    emailService.sendBookingAcceptedNotification(booking.user.email, booking.hotel.name, bookingId).catch(() => {});
  }
  return transform(updated);
}

async function proposeCost(bookingId, cost, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });

  // Validate current status allows cost proposal
  const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
  const allowed = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED'];
  if (!currentStatus || !allowed.includes(currentStatus.name)) {
    throw Object.assign(new Error(`Cannot propose cost in ${currentStatus?.name || 'unknown'} status`), { status: 400 });
  }

  const status = await getOrCreateStatus('COST_PROPOSED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { totalCost: cost, statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, ownerId, `Cost proposed: ${cost} ETB`, true);
  if (booking.user.email) {
    emailService.sendCostProposedNotification(booking.user.email, booking.hotel.name, cost, bookingId).catch(() => {});
  }
  return transform(updated);
}

async function uploadReceipt(bookingId, receiptUrl, userId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.userId !== userId) throw Object.assign(new Error('Not authorized'), { status: 403 });

  // Validate current status is COST_PROPOSED
  const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
  if (!currentStatus || currentStatus.name !== 'COST_PROPOSED') {
    throw Object.assign(new Error(`Cannot upload receipt in ${currentStatus?.name || 'unknown'} status. Must be in COST_PROPOSED status`), { status: 400 });
  }

  const status = await getOrCreateStatus('PAID');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { receiptImageUrl: receiptUrl, statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, userId, 'Receipt uploaded', false);
  // Notify owner — fire-and-forget
  if (booking.hotel.ownerId) {
    prisma.user.findUnique({ where: { id: booking.hotel.ownerId } }).then(owner => {
      if (owner?.email) emailService.sendReceiptUploadedNotification(owner.email, booking.hotel.name, bookingId).catch(() => {});
    }).catch(() => {});
  }
  return transform(updated);
}

async function approveBooking(bookingId, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });

  // Validate current status is PAID
  const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
  if (!currentStatus || currentStatus.name !== 'PAID') {
    throw Object.assign(new Error(`Cannot approve booking in ${currentStatus?.name || 'unknown'} status. Must be in PAID status`), { status: 400 });
  }

  const status = await getOrCreateStatus('APPROVED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, ownerId, 'Booking approved', true);
  if (booking.user.email) {
    emailService.sendBookingApprovedNotification(booking.user.email, booking.hotel.name, bookingId).catch(() => {});
  }
  return transform(updated);
}

async function rejectBooking(bookingId, reason, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });

  // Validate current status allows rejection
  const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
  const rejectable = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID'];
  if (!currentStatus || !rejectable.includes(currentStatus.name)) {
    throw Object.assign(new Error(`Cannot reject booking in ${currentStatus?.name || 'unknown'} status`), { status: 400 });
  }

  const status = await getOrCreateStatus('REJECTED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id, rejectionReason: reason }, include: INCLUDE });
  await addMessage(bookingId, ownerId, `Rejected: ${reason}`, true);
  // Fire-and-forget email — never block the response
  if (booking.user.email) {
    emailService.sendBookingRejectedNotification(booking.user.email, booking.hotel.name, reason, bookingId).catch(() => {});
  }
  return transform(updated);
}

async function sendMessage(bookingId, userId, message, isFromOwner = false) {
  const booking = await addMessage(bookingId, userId, message, isFromOwner);
  return transform(booking);
}

async function reportProblem(bookingId, problem) {
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { problemReport: problem, problemReported: true }, include: INCLUDE });
  return transform(updated);
}

async function getAllAdmin(page = 0, size = 20) {
  const p = parseInt(page) || 0;
  const s = parseInt(size) || 20;
  const [bookings, total] = await Promise.all([
    prisma.hotelBooking.findMany({ skip: p * s, take: s, include: INCLUDE, orderBy: { createdAt: 'desc' } }),
    prisma.hotelBooking.count(),
  ]);
  return { content: bookings.map(transform), totalElements: total, totalPages: Math.ceil(total / s) };
}

async function getProblemBookings() {
  const bookings = await prisma.hotelBooking.findMany({
    where: { problemReported: true },
    include: INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return bookings.map(transform);
}

async function resolveBooking(id, resolution) {
  const updated = await prisma.hotelBooking.update({ where: { id }, data: { problemReport: resolution }, include: INCLUDE });
  return transform(updated);
}

module.exports = {
  create, findAll, findById, update, updateStatus, remove,
  getByUser, getByHotel, getByOwner,
  acceptRequest, proposeCost, uploadReceipt, approveBooking, rejectBooking,
  sendMessage, reportProblem, getAllAdmin, getProblemBookings, resolveBooking,
};
