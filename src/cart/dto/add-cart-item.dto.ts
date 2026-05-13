import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Id of the product to add to the cart.',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: 1,
    minimum: 1,
    type: 'integer',
    description:
      'How many units to add. If the product is already in the cart, this is added to the existing quantity. Rejected if total exceeds product stock.',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
