import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @ApiProperty({
    format: 'uuid',
    example: '9e1f4d0a-2c4b-4a3a-9a1f-3d2e1c0a4b5e',
    nullable: true,
    description:
      'Cart id. Null when this is a transient empty cart returned by GET /cart before the first write.',
  })
  id: string | null;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
    description:
      'Owning user id when the cart belongs to an authenticated user. Exactly one of `userId` or `sessionId` is non-null on a persisted cart.',
  })
  userId: string | null;

  @ApiProperty({
    example: 'b48f9c1a-3e4b-4f1c-9d2a-7f1e3b5d6a90',
    nullable: true,
    description:
      'Guest session id when the cart belongs to an anonymous visitor. Send this back as the `X-Cart-Session` header on subsequent requests.',
  })
  sessionId: string | null;

  @ApiProperty({
    type: () => [CartItemDto],
    description: 'Line items currently in the cart.',
  })
  items: CartItemDto[];

  @ApiProperty({
    example: 4,
    type: 'integer',
    description: 'Sum of `quantity` across all items.',
  })
  totalItems: number;

  @ApiProperty({
    example: 519.96,
    type: 'number',
    description: 'Sum of `lineTotal` across all items.',
  })
  subtotal: number;

  @ApiProperty({
    example: 'USD',
    nullable: true,
    description:
      'Currency of the cart. Inferred from the products in the cart; null when the cart is empty.',
  })
  currency: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-05-13T12:00:00.000Z',
    nullable: true,
    description: 'When the cart was created. Null for an empty transient cart.',
  })
  createdAt: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-05-13T12:00:00.000Z',
    nullable: true,
    description:
      'When the cart was last updated. Null for an empty transient cart.',
  })
  updatedAt: Date | null;
}
