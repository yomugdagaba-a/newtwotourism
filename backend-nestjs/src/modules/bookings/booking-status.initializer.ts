import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingStatusInitializer implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeBookingStatuses();
  }

  private async initializeBookingStatuses() {
    const requiredStatuses: BookingStatus[] = [
      BookingStatus.REQUESTED,
      BookingStatus.OWNER_ACCEPTED,
      BookingStatus.COST_PROPOSED,
      BookingStatus.PAID,
      BookingStatus.APPROVED,
      BookingStatus.REJECTED,
    ];

    for (const statusName of requiredStatuses) {
      const exists = await this.prisma.bookingStatusEntity.findUnique({
        where: { name: statusName },
      });

      if (!exists) {
        await this.prisma.bookingStatusEntity.create({
          data: { name: statusName },
        });
        console.log(`✓ Created booking status: ${statusName}`);
      }
    }

    const totalStatuses = await this.prisma.bookingStatusEntity.count();
    console.log(`✓ Booking status initialization complete. Total statuses: ${totalStatuses}`);
  }
}
