import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TourismCategory, PlaceStatus } from '@prisma/client';

export class CreateTourismDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: TourismCategory, isArray: true, description: 'At least one category is required' })
  @IsArray()
  @IsEnum(TourismCategory, { each: true })
  @IsNotEmpty()
  categories!: TourismCategory[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  wereda!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  kebele!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bestTime?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  peaceInfo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  visitTime?: number;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  languages?: string[];

  @ApiProperty({ enum: PlaceStatus, required: false })
  @IsEnum(PlaceStatus)
  @IsOptional()
  status?: PlaceStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false, description: 'Gallery images URLs' })
  @IsArray()
  @IsOptional()
  images?: string[];
}
