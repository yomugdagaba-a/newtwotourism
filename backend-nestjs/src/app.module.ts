import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TourismModule } from './modules/tourism/tourism.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { RoadsModule } from './modules/roads/roads.module';
import { HorseServicesModule } from './modules/horse-services/horse-services.module';
import { LanguageGuidersModule } from './modules/language-guiders/language-guiders.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TourismModule,
    HotelsModule,
    BookingsModule,
    RatingsModule,
    RoadsModule,
    HorseServicesModule,
    LanguageGuidersModule,
    AuditModule,
    AdminModule,
  ],
})
export class AppModule {}
