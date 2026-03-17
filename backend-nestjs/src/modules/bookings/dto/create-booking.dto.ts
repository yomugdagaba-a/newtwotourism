import { IsInt, IsNotEmpty, IsDateString, IsOptional, IsString, IsDecimal, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  hotelId!: number;

  @ApiProperty()
  @IsDateString()
  @Transform(({ value }) => {
    // Convert date-only format to ISO-8601 DateTime
    if (typeof value === 'string' && value.length === 10) {
      return `${value}T00:00:00Z`;
    }
    return value;
  })
  checkIn!: string;

  @ApiProperty()
  @IsDateString()
  @Transform(({ value }) => {
    // Convert date-only format to ISO-8601 DateTime
    if (typeof value === 'string' && value.length === 10) {
      return `${value}T00:00:00Z`;
    }
    return value;
  })
  checkOut!: string;

  @ApiProperty()
  @IsInt()
  numberOfGuests!: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  numberOfRooms?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  specialRequests?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  totalCost?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  receiptImageUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  problemReport?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  problemReported?: boolean;
}
