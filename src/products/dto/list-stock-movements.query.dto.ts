import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { STOCK_MOVEMENT_REASONS } from '../entities/stock-movement.entity';
import type { StockMovementReason } from '../entities/stock-movement.entity';

export class ListStockMovementsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    enum: STOCK_MOVEMENT_REASONS,
    description: 'Optional filter by reason.',
  })
  @IsOptional()
  @IsIn(STOCK_MOVEMENT_REASONS, {
    message: `reason must be one of: ${STOCK_MOVEMENT_REASONS.join(', ')}`,
  })
  reason?: StockMovementReason;
}
