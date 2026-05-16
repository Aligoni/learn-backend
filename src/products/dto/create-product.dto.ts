import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 120,
    example: 'Wireless Headphones',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'wireless-headphones',
    description:
      'URL slug. Lowercase letters, digits, single dashes. Derived from name if omitted.',
    maxLength: 140,
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  slug?: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 2000,
    example: 'Noise-cancelling over-ear headphones with 30h battery.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    format: 'uri',
    example: 'https://picsum.photos/seed/wireless-headphones/600/400',
    description:
      'Product image URL. If omitted, a Picsum placeholder is generated from the slug.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiProperty({ example: 129.99, minimum: 0, type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'ISO 4217 currency code (defaults to USD).',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    example: 42,
    minimum: 0,
    description:
      'Initial stock. Subsequent changes go through stock endpoints.',
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    example: 4.5,
    minimum: 0,
    maximum: 5,
    type: Number,
    description: 'Optional initial rating. Defaults to 0.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category this product belongs to.',
  })
  @IsUUID()
  categoryId: string;
}
