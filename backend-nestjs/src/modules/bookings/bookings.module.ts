import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingStatusInitializer } from './booking-status.initializer';
import { FileUploadService } from './file-upload.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [BookingsService, BookingStatusInitializer, FileUploadService],
  controllers: [BookingsController],
  exports: [BookingsService, FileUploadService],
})
export class BookingsModule {}
