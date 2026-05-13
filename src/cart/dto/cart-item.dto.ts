import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from '../../products/dto/product.dto';

export class CartItemDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c8d2f3a-4a9b-4f3c-8e21-9c0e6a1b1234',
    description: 'Cart line id.',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Id of the product on this line.',
  })
  productId: string;

  @ApiProperty({
    example: 2,
    type: 'integer',
    description: 'Number of units of this product in the cart.',
  })
  quantity: number;

  @ApiProperty({
    example: 259.98,
    type: 'number',
    description: 'quantity × product.price, in the product currency.',
  })
  lineTotal: number;

  @ApiProperty({
    type: () => ProductDto,
    description: 'Full product snapshot at read time (live pricing).',
  })
  product: ProductDto;
}
