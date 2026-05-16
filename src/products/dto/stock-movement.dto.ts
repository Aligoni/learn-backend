import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { STOCK_MOVEMENT_REASONS } from '../entities/stock-movement.entity';
import type { StockMovementReason } from '../entities/stock-movement.entity';

export class StockMovementDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Product this movement applies to.',
  })
  productId: string;

  @ApiProperty({
    example: -3,
    description: 'Signed integer applied to product stock.',
  })
  delta: number;

  @ApiProperty({ enum: STOCK_MOVEMENT_REASONS })
  reason: StockMovementReason;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Manual count after warehouse audit.',
  })
  note: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description:
      'Admin who initiated the change, or null for system actions (e.g. checkout).',
  })
  actorUserId: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
