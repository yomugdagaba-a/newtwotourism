const { bookingRepository, bookingMessageRepository, authRepository } = require('../repositories');
const emailService = require('./email.service');
const sseService = require('./sse.service');
const wsService = require('./ws.service');

class BookingsService {
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
    const prisma = require('../lib/prisma');
    let s = await prisma.bookingStatusEntity.findUnique({ where: { name } });
    if (!s) s = await prisma.bookingStatusEntity.create({ data: { name } });
    return s;
  }

  async _addMessage(bookingId, userId, message, isFromOwner) {
    await bookingMessageRepository.createMessage({ bookingId, userId, message, isFromOwner });
    return await bookingRepository.findByIdWithDetails(bookingId);
  }

  async create(data, userId) {
    const status = await this._getOrCreateStatus('REQUESTED');
    const checkIn = data.checkIn && data.checkIn.length === 10 ? `${data.checkIn}T00:00:00Z` : data.checkIn;
    const checkOut = data.checkOut && data.checkOut.length === 10 ? `${data.checkOut}T00:00:00Z` : data.checkOut;
    const booking = await bookingRepository.create({
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
    });
    const full = await bookingRepository.findByIdWithDetails(booking.id);
    const result = this._transform(full);
    if (result.hotel?.ownerId) {
      const payload = {
        bookingId: result.bookingId, hotelName: result.hotel.name,
        clientName: result.client?.fullName || result.client?.username,
        message: `New booking request from ${result.client?.fullName || result.client?.username}`,
        booking: result, timestamp: new Date().toISOString(),
      };
      wsService.notifyNewBooking(result.hotel.ownerId, payload);
      sseService.sendToUsers([result.hotel.ownerId], 'booking_new', payload);
    }
    return result;
  }

  async findAll(skip = 0, take = 10, hotelId, userId) {
    const result = await bookingRepository.findAllWithDetails(parseInt(skip), parseInt(take), hotelId, userId);
    return { bookings: result.data.map(b => this._transform(b)), total: result.total };
  }

  async findById(id) {
    const booking = await bookingRepository.findByIdWithDetails(id);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    return this._transform(booking);
  }

  async update(id, data) {
    const booking = await bookingRepository.findById(id);
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
    await bookingRepository.update(id, updateData);
    const updated = await bookingRepository.findByIdWithDetails(id);
    return this._transform(updated);
  }

  async updateStatus(id, statusName) {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    const status = await this._getOrCreateStatus(statusName);
    await bookingRepository.updateStatus(id, status.id);
    const updated = await bookingRepository.findByIdWithDetails(id);
    return this._transform(updated);
  }

  async remove(id) {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    return await bookingRepository.delete(id);
  }

  async getByUser(userId) {
    const bookings = await bookingRepository.getByUser(userId);
    return bookings.map(b => this._transform(b));
  }

  async getByHotel(hotelId, skip = 0, take = 10) {
    const result = await bookingRepository.getByHotel(parseInt(hotelId), parseInt(skip), parseInt(take));
    return result.data.map(b => this._transform(b));
  }

  async getByOwner(ownerId) {
    const bookings = await bookingRepository.getByOwner(ownerId);
    return bookings.map(b => this._transform(b));
  }

  async acceptRequest(bookingId, ownerId) {
    const booking = await bookingRepository.findByIdWithDetails(bookingId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    if (booking.status?.name !== 'REQUESTED') throw Object.assign(new Error(`Cannot accept booking in ${booking.status?.name} status`), { status: 400 });
    const status = await this._getOrCreateStatus('OWNER_ACCEPTED');
    await bookingRepository.updateStatus(bookingId, status.id);
    await this._addMessage(bookingId, ownerId, 'Request accepted', true);
    if (booking.user?.email) emailService.sendBookingAcceptedNotification(booking.user.email, booking.hotel.name, bookingId).catch(() => {});
    const updated = await bookingRepository.findByIdWithDetails(bookingId);
    const result = this._transform(updated);
    const msg = `Your booking at ${booking.hotel.name} was accepted`;
    wsService.notifyBookingUpdate(result, msg);
    sseService.notifyBookingUpdate(result, 'booking_update', msg);
    return result;
  }

  async proposeCost(bookingId, cost, ownerId) {
    const booking = await bookingRepository.findByIdWithDetails(bookingId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    const allowed = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED'];
    if (!allowed.includes(booking.status?.name)) throw Object.assign(new Error(`Cannot propose cost in ${booking.status?.name} status`), { status: 400 });
    const status = await this._getOrCreateStatus('COST_PROPOSED');
    await bookingRepository.update(bookingId, { totalCost: cost, statusId: status.id });
    await this._addMessage(bookingId, ownerId, `Cost proposed: ${cost} ETB`, true);
    if (booking.user?.email) emailService.sendCostProposedNotification(booking.user.email, booking.hotel.name, cost, bookingId).catch(() => {});
    const updated = await bookingRepository.findByIdWithDetails(bookingId);
    const result = this._transform(updated);
    const msg = `Cost of ${cost} ETB proposed for your booking at ${booking.hotel.name}`;
    wsService.notifyBookingUpdate(result, msg);
    sseService.notifyBookingUpdate(result, 'booking_update', msg);
    return result;
  }

  async uploadReceipt(bookingId, receiptUrl, userId) {
    const booking = await bookingRepository.findByIdWithDetails(bookingId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.userId !== userId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    if (booking.status?.name !== 'COST_PROPOSED') throw Object.assign(new Error(`Cannot upload receipt in ${booking.status?.name} status`), { status: 400 });
    const status = await this._getOrCreateStatus('PAID');
    await bookingRepository.update(bookingId, { receiptImageUrl: receiptUrl, statusId: status.id });
    await this._addMessage(bookingId, userId, 'Receipt uploaded', false);
    const updated = await bookingRepository.findByIdWithDetails(bookingId);
    const result = this._transform(updated);
    const msg = `Receipt uploaded for booking at ${booking.hotel.name}`;
    wsService.notifyBookingUpdate(result, msg);
    sseService.notifyBookingUpdate(result, 'booking_update', msg);
    return result;
  }

  async approveBooking(bookingId, ownerId) {
    const booking = await bookingRepository.findByIdWithDetails(bookingId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    if (booking.status?.name !== 'PAID') throw Object.assign(new Error(`Cannot approve booking in ${booking.status?.name} status`), { status: 400 });
    const status = await this._getOrCreateStatus('APPROVED');
    await bookingRepository.updateStatus(bookingId, status.id);
    await this._addMessage(bookingId, ownerId, 'Booking approved', true);
    if (booking.user?.email) emailService.sendBookingApprovedNotification(booking.user.email, booking.hotel.name, bookingId).catch(() => {});
    const updated = await bookingRepository.findByIdWithDetails(bookingId);
    const result = this._transform(updated);
    const msg = `Your booking at ${booking.hotel.name} was approved!`;
    wsService.notifyBookingUpdate(result, msg);
    sseService.notifyBookingUpdate(result, 'booking_update', msg);
    return result;
  }

  async rejectBooking(bookingId, reason, ownerId) {
    const booking = await bookingRepository.findByIdWithDetails(bookingId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (booking.hotel.ownerId !== ownerId) throw Object.assign(new Error('Not authorized'), { status: 403 });
    const rejectable = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID'];
    if (!rejectable.includes(booking.status?.name)) throw Object.assign(new Error(`Cannot reject booking in ${booking.status?.name} status`), { status: 400 });
    const status = await this._getOrCreateStatus('REJECTED');
    await bookingRepository.update(bookingId, { statusId: status.id, rejectionReason: reason });
    await this._addMessage(bookingId, ownerId, `Rejected: ${reason}`, true);
    if (booking.user?.email) emailService.sendBookingRejectedNotification(booking.user.email, booking.hotel.name, reason, bookingId).catch(() => {});
    const updated = await bookingRepository.findByIdWithDetails(bookingId);
    const result = this._transform(updated);
    const msg = `Your booking at ${booking.hotel.name} was rejected`;
    wsService.notifyBookingUpdate(result, msg);
    sseService.notifyBookingUpdate(result, 'booking_update', msg);
    return result;
  }

  async sendMessage(bookingId, userId, message, isFromOwner = false) {
    const booking = await this._addMessage(bookingId, userId, message, isFromOwner);
    const result = this._transform(booking);
    const clientId = result.client?.id;
    const ownerId = result.hotel?.ownerId;
    const recipientId = isFromOwner ? clientId : ownerId;
    if (recipientId) {
      sseService.sendToUsers([recipientId], 'booking_message', {
        bookingId: result.bookingId, hotelName: result.hotel?.name,
        senderName: isFromOwner ? (result.hotel?.ownerName || 'Owner') : (result.client?.fullName || result.client?.username || 'Client'),
        message, isFromOwner, booking: result, timestamp: new Date().toISOString(),
      });
    }
    return result;
  }

  async reportProblem(bookingId, problem) {
    await bookingRepository.reportProblem(bookingId, problem);
    const updated = await bookingRepository.findByIdWithDetails(bookingId);
    return this._transform(updated);
  }

  async getAllAdmin(page = 0, size = 20) {
    const p = parseInt(page) || 0;
    const s = parseInt(size) || 20;
    const result = await bookingRepository.findAllWithDetails(p * s, s);
    return { content: result.data.map(b => this._transform(b)), totalElements: result.total, totalPages: Math.ceil(result.total / s) };
  }

  async getProblemBookings() {
    const bookings = await bookingRepository.getProblemBookings();
    return bookings.map(b => this._transform(b));
  }

  async resolveBooking(id, resolution) {
    await bookingRepository.update(id, { problemReport: resolution });
    const updated = await bookingRepository.findByIdWithDetails(id);
    return this._transform(updated);
  }

  async hideFromClient(id, userId) {
    const booking = await bookingRepository.findByIdWithDetails(id);
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
    const isClient = booking.userId === userId;
    const isOwner = booking.hotel?.ownerId === userId;
    if (!isClient && !isOwner) throw Object.assign(new Error('Not authorized'), { status: 403 });
    if (isClient) {
      await bookingRepository.hideFromClient(id);
    } else {
      await bookingRepository.hideFromOwner(id);
    }
    const updated = await bookingRepository.findByIdWithDetails(id);
    return this._transform(updated);
  }
}

module.exports = new BookingsService();
