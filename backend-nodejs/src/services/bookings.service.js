const prisma = require('../lib/prisma');
const emailService = require('./email.service');

const INCLUDE = { hotel: true, user: true, status: true, messages: { include: { user: true } } };

function transform(b) {
  if (!b) return b;
  return {
    ...b, bookingId: b.id, bookingStatus: b.status?.name || 'UNKNOWN',
    totalCost: b.totalCost ? parseFloat(b.totalCost.toString()) : null,
    hotel: { id: b.hotel?.id, name: b.hotel?.name, contactInfo: b.hotel?.contactInfo, active: b.hotel?.active },
    client: { id: b.user?.id, fullName: b.user?.fullName, username: b.user?.username, email: b.user?.email, phone: b.clientPhone },
    messages: (b.messages || []).map(m => ({ id: m.id, senderId: m.userId, senderName: m.user?.fullName || m.user?.username || 'Unknown', message: m.message, messageType: m.isFromOwner ? 'OWNER' : 'GENERAL', createdAt: m.createdAt })),
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
  const booking = await prisma.hotelBooking.create({ data: { ...data, userId, statusId: status.id }, include: INCLUDE });
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
  const updated = await prisma.hotelBooking.update({ where: { id }, data, include: INCLUDE });
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
  const bookings = await prisma.hotelBooking.findMany({ where: { userId }, skip: parseInt(skip), take: parseInt(take), include: INCLUDE });
  return bookings.map(transform);
}

async function getByHotel(hotelId, skip = 0, take = 10) {
  const bookings = await prisma.hotelBooking.findMany({ where: { hotelId }, skip: parseInt(skip), take: parseInt(take), include: INCLUDE });
  return bookings.map(transform);
}

async function getByOwner(ownerId) {
  const bookings = await prisma.hotelBooking.findMany({ where: { hotel: { ownerId } }, include: INCLUDE });
  return bookings.map(transform);
}

async function acceptRequest(bookingId, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
  const status = await getOrCreateStatus('OWNER_ACCEPTED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, ownerId, 'Request accepted', true);
  try { if (booking.user.email) await emailService.sendBookingAcceptedNotification(booking.user.email, booking.hotel.name, bookingId); } catch (e) {}
  return transform(updated);
}

async function proposeCost(bookingId, cost, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
  const status = await getOrCreateStatus('COST_PROPOSED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { totalCost: cost, statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, ownerId, `Cost proposed: ${cost} ETB`, true);
  try { if (booking.user.email) await emailService.sendCostProposedNotification(booking.user.email, booking.hotel.name, cost, bookingId); } catch (e) {}
  return transform(updated);
}

async function uploadReceipt(bookingId, receiptUrl, userId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.userId !== userId) throw Object.assign(new Error('Not authorized'), { status: 403 });
  const status = await getOrCreateStatus('PAID');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { receiptImageUrl: receiptUrl, statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, userId, 'Receipt uploaded', false);
  return transform(updated);
}

async function approveBooking(bookingId, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
  const status = await getOrCreateStatus('APPROVED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id }, include: INCLUDE });
  await addMessage(bookingId, ownerId, 'Booking approved', true);
  try { if (booking.user.email) await emailService.sendBookingApprovedNotification(booking.user.email, booking.hotel.name, bookingId); } catch (e) {}
  return transform(updated);
}

async function rejectBooking(bookingId, reason, ownerId) {
  const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
  const status = await getOrCreateStatus('REJECTED');
  const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id, rejectionReason: reason }, include: INCLUDE });
  await addMessage(bookingId, ownerId, `Rejected: ${reason}`, true);
  try { if (booking.user.email) await emailService.sendBookingRejectedNotification(booking.user.email, booking.hotel.name, reason, bookingId); } catch (e) {}
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
  const p = parseInt(page), s = parseInt(size);
  const [bookings, total] = await Promise.all([
    prisma.hotelBooking.findMany({ skip: p * s, take: s, include: INCLUDE }),
    prisma.hotelBooking.count(),
  ]);
  return { content: bookings.map(transform), totalElements: total, totalPages: Math.ceil(total / s) };
}

async function getProblemBookings() {
  const bookings = await prisma.hotelBooking.findMany({ where: { problemReported: true }, include: INCLUDE });
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
