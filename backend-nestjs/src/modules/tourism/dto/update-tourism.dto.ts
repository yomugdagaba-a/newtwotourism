import { PartialType } from '@nestjs/swagger';
import { CreateTourismDto } from './create-tourism.dto';

export class UpdateTourismDto extends PartialType(CreateTourismDto) {}
