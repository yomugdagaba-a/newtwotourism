import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(5)
  starRating!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactInfo!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  policies?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  tourismPlaceId?: number;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ required: false, description: 'Main image URL' })
  @IsString()
  @IsOptional()
  mainImageUrl?: string;

  @ApiProperty({ required: false, description: 'Gallery images URLs' })
  @IsArray()
  @IsOptional()
  images?: string[];
}
