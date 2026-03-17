import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RoadTypeEnum {
  CAR = 'CAR',
  FOOT = 'FOOT',
  HORSE = 'HORSE',
  PLANE = 'PLANE',
}

export class CreateRoadDto {
  @ApiProperty({ example: 1, description: 'Tourism place ID' })
  @IsNotEmpty({ message: 'Tourism place ID is required' })
  @IsNumber()
  tourismPlaceId!: number;

  @ApiProperty({ example: 'Addis Ababa', description: 'Initial place (starting location)' })
  @IsNotEmpty({ message: 'Initial place is required' })
  @IsString()
  initialPlace!: string;

  @ApiProperty({ enum: RoadTypeEnum, default: 'CAR', description: 'Road type' })
  @IsOptional()
  @IsEnum(RoadTypeEnum)
  roadType: RoadTypeEnum = RoadTypeEnum.CAR;

  @ApiProperty({ example: 'Paved road with good conditions', description: 'Road description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 100.5, description: 'Distance by car in km', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Distance by car must be positive' })
  distanceByCar?: number;

  @ApiProperty({ example: 150, description: 'Distance by foot in km', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Distance by foot must be positive' })
  distanceByFoot?: number;

  @ApiProperty({ example: 80, description: 'Distance by plane in km', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Distance by plane must be positive' })
  distanceByPlane?: number;

  @ApiProperty({ example: 120, description: 'Distance by horse in km', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Distance by horse must be positive' })
  distanceByHorse?: number;

  @ApiProperty({ example: 100, description: 'Total distance in km', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Total distance must be positive' })
  totalDistance?: number;
}
