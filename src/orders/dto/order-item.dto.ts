import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Product id at purchase time.' })
  productId: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({
    example: 19.99,
    description: 'Per-unit price snapshotted at purchase time.',
  })
  unitPrice: number;

  @ApiProperty({ example: 39.98 })
  lineTotal: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'Trail Tent' })
  productName: string;

  @ApiProperty({ example: 'trail-tent' })
  productSlug: string;

  @ApiProperty({
    example: 'https://picsum.photos/seed/trail-tent/600/400',
  })
  productImageUrl: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
