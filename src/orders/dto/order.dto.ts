import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemDto } from './order-item.dto';
import { ORDER_STATUSES } from '../entities/order.entity';
import type { OrderStatus } from '../entities/order.entity';

export class OrderDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Owner of the order.' })
  userId: string;

  @ApiProperty({ enum: ORDER_STATUSES, example: 'pending' })
  status: OrderStatus;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 79.96, description: 'Sum of line totals.' })
  subtotal: number;

  @ApiProperty({
    example: 5.99,
    description: 'Snapshotted shipping fee at the moment of checkout.',
  })
  shippingFee: number;

  @ApiProperty({ example: 85.95, description: 'subtotal + shippingFee' })
  total: number;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
