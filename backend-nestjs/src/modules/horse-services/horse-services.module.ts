import { Module } from '@nestjs/common';
import { HorseServicesService } from './horse-services.service';
import { HorseServicesController, RoadsHorseServicesController } from './horse-services.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HorseServicesService],
  controllers: [HorseServicesController, RoadsHorseServicesController],
  exports: [HorseServicesService],
})
export class HorseServicesModule {}
