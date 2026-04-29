import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum ProductSortBy {
  createdAt = 'createdAt',
  name = 'name',
  price = 'price',
  rating = 'rating',
}

export enum ProductSortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Page number (1-based).',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    description: 'Items per page.',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    description: 'Search in product name and description (case-insensitive).',
    example: 'headphones',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by category slug.',
    example: 'electronics',
  })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    description: 'Minimum price (inclusive).',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price (inclusive).',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: ProductSortBy,
    default: ProductSortBy.createdAt,
    description: 'Field to sort by.',
  })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy: ProductSortBy = ProductSortBy.createdAt;

  @ApiPropertyOptional({
    enum: ProductSortOrder,
    default: ProductSortOrder.desc,
    description: 'Sort direction.',
  })
  @IsOptional()
  @IsEnum(ProductSortOrder)
  sortOrder: ProductSortOrder = ProductSortOrder.desc;
}
