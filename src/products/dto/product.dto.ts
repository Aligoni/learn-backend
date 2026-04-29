import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class ProductDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Product id.',
  })
  id: string;

  @ApiProperty({ example: 'Wireless Headphones', description: 'Product name.' })
  name: string;

  @ApiProperty({
    example: 'wireless-headphones',
    description: 'URL-safe unique slug.',
  })
  slug: string;

  @ApiProperty({
    example: 'Noise-cancelling over-ear headphones with 30h battery.',
    description: 'Full product description.',
  })
  description: string;

  @ApiProperty({
    format: 'uri',
    example: 'https://picsum.photos/seed/wireless-headphones/600/400',
    description: 'Product image URL.',
  })
  imageUrl: string;

  @ApiProperty({
    example: 129.99,
    description: 'Price in the given currency.',
    type: 'number',
  })
  price: number;

  @ApiProperty({
    example: 'USD',
    description: 'ISO 4217 currency code.',
  })
  currency: string;

  @ApiProperty({
    example: 42,
    description: 'Units in stock.',
  })
  stock: number;

  @ApiProperty({
    example: 4.5,
    description: 'Average rating from 0 to 5.',
    type: 'number',
  })
  rating: number;

  @ApiProperty({
    type: () => CategoryDto,
    description: 'Category this product belongs to.',
  })
  category: CategoryDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-04-23T12:00:00.000Z',
    description: 'When the product was created.',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-04-23T12:00:00.000Z',
    description: 'When the product was last updated.',
  })
  updatedAt: Date;
}
