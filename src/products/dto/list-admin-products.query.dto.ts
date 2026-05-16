import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProductSortBy, ProductSortOrder } from './list-products.query.dto';

const toBool = ({
  obj,
  key,
}: {
  obj: Record<string, unknown>;
  key: string;
}): unknown => {
  const raw = obj[key];
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return raw;
};

export class ListAdminProductsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ description: 'Search name/description.' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category slug.' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description:
      'When true (default) soft-deleted products are included. Set to false to see only active products.',
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  includeDeleted?: boolean = true;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description:
      'When true, ONLY soft-deleted products are returned. Overrides `includeDeleted`.',
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  onlyDeleted?: boolean = false;

  @ApiPropertyOptional({
    enum: ProductSortBy,
    default: ProductSortBy.createdAt,
  })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy: ProductSortBy = ProductSortBy.createdAt;

  @ApiPropertyOptional({
    enum: ProductSortOrder,
    default: ProductSortOrder.desc,
  })
  @IsOptional()
  @IsEnum(ProductSortOrder)
  sortOrder: ProductSortOrder = ProductSortOrder.desc;
}
