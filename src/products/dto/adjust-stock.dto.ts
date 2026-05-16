import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  NotEquals,
} from 'class-validator';
import { STOCK_MOVEMENT_REASONS } from '../entities/stock-movement.entity';
import type { StockMovementReason } from '../entities/stock-movement.entity';

export class AdjustStockDto {
  @ApiProperty({
    type: Number,
    example: -3,
    description:
      'Signed integer. Positive adds stock (restock, return), negative removes (sale, correction). Must be non-zero.',
  })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0, { message: 'delta must be non-zero.' })
  delta: number;

  @ApiProperty({
    enum: STOCK_MOVEMENT_REASONS,
    example: 'restock',
    description: 'Why this movement happened. Recorded in the audit history.',
  })
  @IsIn(STOCK_MOVEMENT_REASONS, {
    message: `reason must be one of: ${STOCK_MOVEMENT_REASONS.join(', ')}`,
  })
  reason: StockMovementReason;

  @ApiPropertyOptional({
    example: 'Received shipment from supplier #4421.',
    description: 'Optional free-text note attached to this movement.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
