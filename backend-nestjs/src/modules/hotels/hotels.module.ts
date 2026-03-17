import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelsController, TourismHotelsController } from './hotels.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HotelsService],
  controllers: [HotelsController, TourismHotelsController],
  exports: [HotelsService],
})
export class HotelsModule {}
