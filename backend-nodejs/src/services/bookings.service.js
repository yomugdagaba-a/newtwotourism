const prisma = require('../lib/prisma');
const emailService = require('./email-gmail.service');
const sseService = require('./sse.service');

const INCLUDE = {
  hotel: { include: { owner: true } },
  user: true,
  status: true,
  messages: { include: { user: true }, orderBy: { createdAt: 'asc' } },
};

class BookingsService {
  // ── Helpers ────────────────────────────────────────────────────────────────

  _formatDate(dt) {
    if (!dt) return null;
    const s = dt instanceof Date ? dt.toISOString() : String(dt);
    return s.length > 10 ? s.substring(0, 10) : s;
  }

  _transform(b) {
    if (!b) return b;
    return {
      ...b,
      bookingId: b.id,
      bookingStatus: b.status?.name || 'UNKNOWN',
      checkIn: this._formatDate(b.checkIn),
      checkOut: this._formatDate(b.checkOut),
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

  async _getOrCreateStatus(name) {
    let s = await prisma.bookingStatusEntity.findUnique({ where: { name } });
    if (!s) s = await prisma.bookingStatusEntity.create({ data: { name } });
    return s;
  }

  async _addMessage(bookingId, userId, message, isFromOwner) {
    await prisma.bookingMessage.create({ data: { bookingId, userId, message, isFromOwner } });
    return prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: INCLUDE });
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(data, userId) {
    const status = await this._getOrCreateStatus('REQUESTED');
    const checkIn = data.checkIn && data.checkIn.length === 10 ? `${data.checkIn}T00:00:00Z` : data.checkIn;
    const checkOut = data.checkOut && data.checkOut.length === 10 ? `${data.checkOut}T00:00:00Z` : data.checkOut;
    const booking = await prisma.hotelBooking.create({
      data: {
        hotelId: parseInt(data.hotelId), userId, statusId: status.id,
        checkIn: new Date(checkIn), checkOut: new Date(checkOut),
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
    const result = this._transform(booking);
    // Notify the hotel owner in real-time about the new booking
    if (result.hotel?.ownerId) {
      sseService.sendToUsers([result.hotel.ownerId], 'booking_new', {
        bookingId:  result.bookingId,
        hotelName:  result.hotel.name,
        clientName: result.client?.fullName || result.client?.username,
        message:    `New booking request from ${result.client?.fullName || result.client?.username}`,
        booking:    result,
        timestamp:  new Date().toISOString(),
      });
    }
    return result;
  }

  async findAll(skip = 0, take = 10, hotelId, userId) {
    const where = {};
    if (hotelId) where.hotelId = parseInt(hotelId);
    if (userId) where.userId = parseInt(userId);
    const [bookings, total] = await Promise.all([
      prisma.hotelBooking.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE }),
      prisma.hotelBooking.count({ where }),
    ]);
    return { bookings: bookings.map(b => this._transform(b)), total };
  }

  async findById(id) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id }, include: INCLUDE });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    return this._transform(booking);
  }

  async update(id, data) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
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
    return this._transform(updated);
  }

  async updateStatus(id, statusName) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    const status = await this._getOrCreateStatus(statusName);
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { statusId: status.id }, include: INCLUDE });
    return this._transform(updated);
  }

  async remove(id) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    return prisma.hotelBooking.delete({ where: { id } });
  }

  async getByUser(userId, skip = 0, take = 100) {
    const bookings = await prisma.hotelBooking.findMany({
      where: { userId, hiddenFromClient: false },
      skip: parseInt(skip), take: parseInt(take),
      include: INCLUDE, orderBy: { createdAt: 'desc' },
    });
    return bookings.map(b => this._transform(b));
  }

  async getByHotel(hotelId, skip = 0, take = 10) {
    const bookings = await prisma.hotelBooking.findMany({
      where: { hotelId }, skip: parseInt(skip), take: parseInt(take),
      include: INCLUDE, orderBy: { createdAt: 'desc' },
    });
    return bookings.map(b => this._transform(b));
  }

  async getByOwner(ownerId) {
    const bookings = await prisma.hotelBooking.findMany({
      where: { 
        hotel: { ownerId },
        hiddenFromOwner: false  // Don't show bookings hidden by owner
      }, 
      include: INCLUDE, 
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map(b => this._transform(b));
  }

  // ── Workflow Actions ───────────────────────────────────────────────────────

  async acceptRequest(bookingId, ownerId) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
    if (!currentStatus || currentStatus.name !== 'REQUESTED') throw Object.assign(new Error(`Cannot accept booking in ${currentStatus?.name || 'unknown'} status`), { status: 400 });
    const status = await this._getOrCreateStatus('OWNER_ACCEPTED');
    const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id }, include: INCLUDE });
    await this._addMessage(bookingId, ownerId, 'Request accepted', true);
    if (booking.user.email) emailService.sendBookingAcceptedNotification(booking.user.email, booking.hotel.name, bookingId).catch(() => {});
    const result = this._transform(updated);
    sseService.notifyBookingUpdate(result, 'booking_update', `Your booking at ${booking.hotel.name} was accepted`);
    return result;
  }

  async proposeCost(bookingId, cost, ownerId) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
    const allowed = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED'];
    if (!currentStatus || !allowed.includes(currentStatus.name)) throw Object.assign(new Error(`Cannot propose cost in ${currentStatus?.name || 'unknown'} status`), { status: 400 });
    const status = await this._getOrCreateStatus('COST_PROPOSED');
    const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { totalCost: cost, statusId: status.id }, include: INCLUDE });
    await this._addMessage(bookingId, ownerId, `Cost proposed: ${cost} ETB`, true);
    if (booking.user.email) emailService.sendCostProposedNotification(booking.user.email, booking.hotel.name, cost, bookingId).catch(() => {});
    const result = this._transform(updated);
    sseService.notifyBookingUpdate(result, 'booking_update', `Cost of ${cost} ETB proposed for your booking at ${booking.hotel.name}`);
    return result;
  }

  async uploadReceipt(bookingId, receiptUrl, userId) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.userId !== userId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
    if (!currentStatus || currentStatus.name !== 'COST_PROPOSED') throw Object.assign(new Error(`Cannot upload receipt in ${currentStatus?.name || 'unknown'} status. Must be in COST_PROPOSED status`), { status: 400 });
    const status = await this._getOrCreateStatus('PAID');
    const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { receiptImageUrl: receiptUrl, statusId: status.id }, include: INCLUDE });
    await this._addMessage(bookingId, userId, 'Receipt uploaded', false);
    if (booking.hotel.ownerId) {
      prisma.user.findUnique({ where: { id: booking.hotel.ownerId } }).then(owner => {
        if (owner?.email) emailService.sendReceiptUploadedNotification(owner.email, booking.hotel.name, bookingId).catch(() => {});
      }).catch(() => {});
    }
    const result = this._transform(updated);
    sseService.notifyBookingUpdate(result, 'booking_update', `Receipt uploaded for booking at ${booking.hotel.name}`);
    return result;
  }

  async approveBooking(bookingId, ownerId) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
    if (!currentStatus || currentStatus.name !== 'PAID') throw Object.assign(new Error(`Cannot approve booking in ${currentStatus?.name || 'unknown'} status. Must be in PAID status`), { status: 400 });
    const status = await this._getOrCreateStatus('APPROVED');
    const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id }, include: INCLUDE });
    await this._addMessage(bookingId, ownerId, 'Booking approved', true);
    if (booking.user.email) emailService.sendBookingApprovedNotification(booking.user.email, booking.hotel.name, bookingId).catch(() => {});
    const result = this._transform(updated);
    sseService.notifyBookingUpdate(result, 'booking_update', `Your booking at ${booking.hotel.name} was approved!`);
    return result;
  }

  async rejectBooking(bookingId, reason, ownerId) {
    const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: { hotel: true, user: true } });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    const currentStatus = await prisma.bookingStatusEntity.findUnique({ where: { id: booking.statusId } });
    const rejectable = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID'];
    if (!currentStatus || !rejectable.includes(currentStatus.name)) throw Object.assign(new Error(`Cannot reject booking in ${currentStatus?.name || 'unknown'} status`), { status: 400 });
    const status = await this._getOrCreateStatus('REJECTED');
    const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { statusId: status.id, rejectionReason: reason }, include: INCLUDE });
    await this._addMessage(bookingId, ownerId, `Rejected: ${reason}`, true);
    if (booking.user.email) emailService.sendBookingRejectedNotification(booking.user.email, booking.hotel.name, reason, bookingId).catch(() => {});
    const result = this._transform(updated);
    sseService.notifyBookingUpdate(result, 'booking_update', `Your booking at ${booking.hotel.name} was rejected`);
    return result;
  }

  async sendMessage(bookingId, userId, message, isFromOwner = false) {
    const booking = await this._addMessage(bookingId, userId, message, isFromOwner);
    const result = this._transform(booking);

    // Push the new message to the other party in real-time
    const clientId = result.client?.id;
    const ownerId  = result.hotel?.ownerId;
    // Notify the recipient (not the sender)
    const recipientId = isFromOwner ? clientId : ownerId;
    if (recipientId) {
      sseService.sendToUsers([recipientId], 'booking_message', {
        bookingId:  result.bookingId,
        hotelName:  result.hotel?.name,
        senderName: isFromOwner ? (result.hotel?.ownerName || 'Owner') : (result.client?.fullName || result.client?.username || 'Client'),
        message,
        isFromOwner,
        booking:    result,
        timestamp:  new Date().toISOString(),
      });
    }
    return result;
  }

  async reportProblem(bookingId, problem) {
    const updated = await prisma.hotelBooking.update({ where: { id: bookingId }, data: { problemReport: problem, problemReported: true }, include: INCLUDE });
    return this._transform(updated);
  }

  async getAllAdmin(page = 0, size = 20) {
    const p = parseInt(page) || 0;
    const s = parseInt(size) || 20;
    const [bookings, total] = await Promise.all([
      prisma.hotelBooking.findMany({ skip: p * s, take: s, include: INCLUDE, orderBy: { createdAt: 'desc' } }),
      prisma.hotelBooking.count(),
    ]);
    return { content: bookings.map(b => this._transform(b)), totalElements: total, totalPages: Math.ceil(total / s) };
  }

  async getProblemBookings() {
    const bookings = await prisma.hotelBooking.findMany({
      where: { problemReported: true }, include: INCLUDE, orderBy: { createdAt: 'desc' },
    });
    return bookings.map(b => this._transform(b));
  }

  async resolveBooking(id, resolution) {
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { problemReport: resolution }, include: INCLUDE });
    return this._transform(updated);
  }

  async hideFromClient(id, userId) {
    const booking = await prisma.hotelBooking.findUnique({ 
      where: { id },
      include: { hotel: true }
    });
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    
    // Determine if the user is the client or the owner
    const isClient = booking.userId === userId;
    const isOwner = booking.hotel?.ownerId === userId;
    
    if (!isClient && !isOwner) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    
    // Hide from the appropriate view
    const updateData = isClient 
      ? { hiddenFromClient: true }
      : { hiddenFromOwner: true };
    
    const updated = await prisma.hotelBooking.update({ 
      where: { id }, 
      data: updateData, 
      include: INCLUDE 
    });
    return this._transform(updated);
  }
}

module.exports = new BookingsService();
