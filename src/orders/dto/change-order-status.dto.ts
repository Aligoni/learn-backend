import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ORDER_STATUSES } from '../entities/order.entity';
import type { OrderStatus } from '../entities/order.entity';

// Pending → paid is owned by the user-facing POST /orders/:id/pay stub.
const ADMIN_TRANSITION_TARGETS = ORDER_STATUSES.filter((s) => s !== 'pending');

export class ChangeOrderStatusDto {
  @ApiProperty({
    enum: ADMIN_TRANSITION_TARGETS,
    description:
      'Target status. The service enforces the state machine; invalid transitions return 409.',
  })
  @IsIn(ADMIN_TRANSITION_TARGETS, {
    message: `status must be one of: ${ADMIN_TRANSITION_TARGETS.join(', ')}`,
  })
  status: OrderStatus;
}
