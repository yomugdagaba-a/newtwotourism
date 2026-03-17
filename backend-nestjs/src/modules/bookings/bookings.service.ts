import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: number) {
    // Get or create REQUESTED status
    let status = await this.prisma.bookingStatusEntity.findUnique({
      where: { name: BookingStatus.REQUESTED },
    });

    if (!status) {
      status = await this.prisma.bookingStatusEntity.create({
        data: { name: BookingStatus.REQUESTED },
      });
    }

    return this.prisma.hotelBooking.create({
      data: {
        ...createBookingDto,
        userId,
        statusId: status.id,
      },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });
  }

  async findAll(skip = 0, take = 10, hotelId?: number, userId?: number) {
    const where: any = {};
    if (hotelId) where.hotelId = hotelId;
    if (userId) where.userId = userId;

    const [bookings, total] = await Promise.all([
      this.prisma.hotelBooking.findMany({
        where,
        skip,
        take,
        include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
      }),
      this.prisma.hotelBooking.count({ where }),
    ]);

    return { bookings, total };
  }

  async findById(id: number) {
    const booking = await this.prisma.hotelBooking.findUnique({
      where: { id },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async update(id: number, updateBookingDto: UpdateBookingDto) {
    const booking = await this.prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.hotelBooking.update({
      where: { id },
      data: updateBookingDto,
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });
  }

  async updateStatus(id: number, statusName: BookingStatus) {
    const booking = await this.prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    let status = await this.prisma.bookingStatusEntity.findUnique({
      where: { name: statusName },
    });

    if (!status) {
      status = await this.prisma.bookingStatusEntity.create({
        data: { name: statusName },
      });
    }

    return this.prisma.hotelBooking.update({
      where: { id },
      data: { statusId: status.id },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });
  }

  async delete(id: number) {
    const booking = await this.prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.hotelBooking.delete({ where: { id } });
  }

  async addMessage(bookingId: number, userId: number, message: string, isFromOwner: boolean) {
    const booking = await this.prisma.hotelBooking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.prisma.bookingMessage.create({
      data: {
        bookingId,
        userId,
        message,
        isFromOwner,
      },
      include: { user: true },
    });

    // Return the full booking with all messages
    return this.prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });
  }

  async getBookingsByUser(userId: number, skip = 0, take = 10) {
    const [bookings, total] = await Promise.all([
      this.prisma.hotelBooking.findMany({
        where: { userId },
        skip,
        take,
        include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
      }),
      this.prisma.hotelBooking.count({ where: { userId } }),
    ]);

    return { bookings, total };
  }

  async getBookingsByHotel(hotelId: number, skip = 0, take = 10) {
    const [bookings, total] = await Promise.all([
      this.prisma.hotelBooking.findMany({
        where: { hotelId },
        skip,
        take,
        include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
      }),
      this.prisma.hotelBooking.count({ where: { hotelId } }),
    ]);

    return { bookings, total };
  }

  // ==================== WORKFLOW METHODS ====================

  async acceptBookingRequest(bookingId: number, ownerId: number) {
    const booking = await this.prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify owner
    if (booking.hotel.ownerId !== ownerId) {
      throw new BadRequestException('Not authorized to accept this booking');
    }

    // Verify current status is REQUESTED
    const currentStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { id: booking.statusId },
    });

    if (!currentStatus || currentStatus.name !== BookingStatus.REQUESTED) {
      throw new BadRequestException(`Cannot accept booking in ${currentStatus?.name || 'unknown'} status`);
    }

    // Transition to OWNER_ACCEPTED
    const ownerAcceptedStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { name: BookingStatus.OWNER_ACCEPTED },
    });

    if (!ownerAcceptedStatus) {
      throw new BadRequestException('OWNER_ACCEPTED status not found in database');
    }

    const updatedBooking = await this.prisma.hotelBooking.update({
      where: { id: bookingId },
      data: { statusId: ownerAcceptedStatus.id },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });

    // Add message
    await this.addMessage(bookingId, booking.hotel.ownerId, 'Request accepted', true);

    // Send email notification
    try {
      if (booking.user.email) {
        await this.emailService.sendBookingAcceptedNotification(
          booking.user.email,
          booking.hotel.name,
          bookingId,
        );
      }
    } catch (error) {
      console.error('Failed to send booking accepted email:', error);
    }

    return updatedBooking;
  }

  async proposeCost(bookingId: number, cost: number, ownerId: number) {
    const booking = await this.prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify owner
    if (booking.hotel.ownerId !== ownerId) {
      throw new BadRequestException('Not authorized to propose cost for this booking');
    }

    // Verify current status allows cost proposal
    const currentStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { id: booking.statusId },
    });

    const allowedStatuses: string[] = [
      BookingStatus.REQUESTED,
      BookingStatus.OWNER_ACCEPTED,
      BookingStatus.COST_PROPOSED,
    ];

    if (!currentStatus || !allowedStatuses.includes(currentStatus.name)) {
      throw new BadRequestException(
        `Cannot propose cost in ${currentStatus?.name || 'unknown'} status. Allowed: ${allowedStatuses.join(', ')}`,
      );
    }

    // Transition to COST_PROPOSED
    const costProposedStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { name: BookingStatus.COST_PROPOSED },
    });

    if (!costProposedStatus) {
      throw new BadRequestException('COST_PROPOSED status not found in database');
    }

    const updatedBooking = await this.prisma.hotelBooking.update({
      where: { id: bookingId },
      data: {
        totalCost: cost,
        statusId: costProposedStatus.id,
      },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });

    // Add message
    await this.addMessage(bookingId, booking.hotel.ownerId, `Cost proposed: ${cost} ETB`, true);

    // Send email notification
    try {
      if (booking.user.email) {
        await this.emailService.sendCostProposedNotification(
          booking.user.email,
          booking.hotel.name,
          cost,
          bookingId,
        );
      }
    } catch (error) {
      console.error('Failed to send cost proposed email:', error);
    }

    return updatedBooking;
  }

  async uploadReceipt(bookingId: number, receiptUrl: string, userId: number) {
    const booking = await this.prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify user is the client
    if (booking.userId !== userId) {
      throw new BadRequestException('Not authorized to upload receipt for this booking');
    }

    // Verify current status is COST_PROPOSED
    const currentStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { id: booking.statusId },
    });

    if (!currentStatus || currentStatus.name !== BookingStatus.COST_PROPOSED) {
      throw new BadRequestException(
        `Cannot upload receipt in ${currentStatus?.name || 'unknown'} status. Must be in COST_PROPOSED status`,
      );
    }

    // Transition to PAID
    const paidStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { name: BookingStatus.PAID },
    });

    if (!paidStatus) {
      throw new BadRequestException('PAID status not found in database');
    }

    const updatedBooking = await this.prisma.hotelBooking.update({
      where: { id: bookingId },
      data: {
        receiptImageUrl: receiptUrl,
        statusId: paidStatus.id,
      },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });

    // Add message
    await this.addMessage(bookingId, userId, 'Receipt uploaded', false);

    // Send email notification to owner
    try {
      if (booking.hotel.ownerId) {
        const owner = await this.prisma.user.findUnique({
          where: { id: booking.hotel.ownerId },
        });
        if (owner?.email) {
          await this.emailService.sendReceiptUploadedNotification(
            owner.email,
            booking.hotel.name,
            bookingId,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send receipt uploaded email:', error);
    }

    return updatedBooking;
  }

  async approveBooking(bookingId: number, ownerId: number) {
    const booking = await this.prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify owner
    if (booking.hotel.ownerId !== ownerId) {
      throw new BadRequestException('Not authorized to approve this booking');
    }

    // Verify current status is PAID
    const currentStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { id: booking.statusId },
    });

    if (!currentStatus || currentStatus.name !== BookingStatus.PAID) {
      throw new BadRequestException(
        `Cannot approve booking in ${currentStatus?.name || 'unknown'} status. Must be in PAID status`,
      );
    }

    // Transition to APPROVED
    const approvedStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { name: BookingStatus.APPROVED },
    });

    if (!approvedStatus) {
      throw new BadRequestException('APPROVED status not found in database');
    }

    const updatedBooking = await this.prisma.hotelBooking.update({
      where: { id: bookingId },
      data: { statusId: approvedStatus.id },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });

    // Add message
    await this.addMessage(bookingId, booking.hotel.ownerId, 'Booking approved', true);

    // Send email notification
    try {
      if (booking.user.email) {
        await this.emailService.sendBookingApprovedNotification(
          booking.user.email,
          booking.hotel.name,
          bookingId,
        );
      }
    } catch (error) {
      console.error('Failed to send booking approved email:', error);
    }

    return updatedBooking;
  }

  async rejectBooking(bookingId: number, reason: string, ownerId: number) {
    const booking = await this.prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify owner
    if (booking.hotel.ownerId !== ownerId) {
      throw new BadRequestException('Not authorized to reject this booking');
    }

    // Transition to REJECTED
    const rejectedStatus = await this.prisma.bookingStatusEntity.findUnique({
      where: { name: BookingStatus.REJECTED },
    });

    if (!rejectedStatus) {
      throw new BadRequestException('REJECTED status not found in database');
    }

    const updatedBooking = await this.prisma.hotelBooking.update({
      where: { id: bookingId },
      data: {
        statusId: rejectedStatus.id,
        rejectionReason: reason,
      },
      include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
    });

    // Add message
    await this.addMessage(bookingId, booking.hotel.ownerId, `Rejected: ${reason}`, true);

    // Send email notification
    try {
      if (booking.user.email) {
        await this.emailService.sendBookingRejectedNotification(
          booking.user.email,
          booking.hotel.name,
          reason,
          bookingId,
        );
      }
    } catch (error) {
      console.error('Failed to send booking rejected email:', error);
    }

    return updatedBooking;
  }

  async getOwnerBookings(ownerId: number, skip = 0, take = 100) {
    const [bookings, total] = await Promise.all([
      this.prisma.hotelBooking.findMany({
        where: {
          hotel: {
            ownerId,
          },
        },
        skip,
        take,
        include: { hotel: true, user: true, status: true, messages: { include: { user: true } } },
      }),
      this.prisma.hotelBooking.count({
        where: {
          hotel: {
            ownerId,
          },
        },
      }),
    ]);

    return { bookings, total };
  }
}
