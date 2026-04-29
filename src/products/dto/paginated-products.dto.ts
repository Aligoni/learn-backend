import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from './product.dto';

export class PaginatedProductsDto {
  @ApiProperty({ type: [ProductDto], description: 'Page of products.' })
  items: ProductDto[];

  @ApiProperty({
    example: 150,
    description: 'Total matching products (all pages).',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page (1-based).' })
  page: number;

  @ApiProperty({ example: 20, description: 'Page size.' })
  limit: number;

  @ApiProperty({ example: 8, description: 'Total number of pages.' })
  totalPages: number;

  @ApiProperty({
    example: true,
    description: 'Whether another page exists after this one.',
  })
  hasNextPage: boolean;
}
