import { Module } from '@nestjs/common';
import { LanguageGuidersService } from './language-guiders.service';
import { LanguageGuidersController } from './language-guiders.controller';
import { GuidersController } from './guiders.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LanguageGuidersService],
  controllers: [LanguageGuidersController, GuidersController],
})
export class LanguageGuidersModule {}
