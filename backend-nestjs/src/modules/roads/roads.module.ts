import { Module } from '@nestjs/common';
import { RoadsService } from './roads.service';
import { RoadsController, TourismRoadsController } from './roads.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoadsService],
  controllers: [RoadsController, TourismRoadsController],
  exports: [RoadsService],
})
export class RoadsModule {}
