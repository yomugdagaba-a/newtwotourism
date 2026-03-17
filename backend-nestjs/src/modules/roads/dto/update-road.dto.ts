import { IsString, IsNumber, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoadTypeEnum } from './create-road.dto';

export class UpdateRoadDto {
  @ApiProperty({ example: 'Addis Ababa', description: 'Initial place (starting location)', required: false })
  @IsOptional()
  @IsString()
  initialPlace?: string;

  @ApiProperty({ enum: RoadTypeEnum, description: 'Road type', required: false })
  @IsOptional()
  @IsEnum(RoadTypeEnum)
  roadType?: RoadTypeEnum;

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
