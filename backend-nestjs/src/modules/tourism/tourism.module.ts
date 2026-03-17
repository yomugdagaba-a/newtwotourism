import { Module } from '@nestjs/common';
import { TourismService } from './tourism.service';
import { TourismController } from './tourism.controller';
import { TourismPublicController } from './tourism-public.controller';
import { UserTourismController } from './user-tourism.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TourismService],
  controllers: [TourismController, TourismPublicController, UserTourismController],
  exports: [TourismService],
})
export class TourismModule {}
