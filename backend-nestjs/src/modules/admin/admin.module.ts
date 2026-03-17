import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminTourismController } from './admin-tourism.controller';
import { AdminHotelsController } from './admin-hotels.controller';
import { AdminRoadsController } from './admin-roads.controller';
import { AdminHorseServicesController } from './admin-horse-services.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { TourismModule } from '../tourism/tourism.module';
import { HotelsModule } from '../hotels/hotels.module';
import { RoadsModule } from '../roads/roads.module';
import { HorseServicesModule } from '../horse-services/horse-services.module';

@Module({
  imports: [
    PrismaModule,
    TourismModule,
    HotelsModule,
    RoadsModule,
    HorseServicesModule,
  ],
  providers: [AdminService],
  controllers: [
    AdminController,
    AdminTourismController,
    AdminHotelsController,
    AdminRoadsController,
    AdminHorseServicesController,
  ],
})
export class AdminModule {}
