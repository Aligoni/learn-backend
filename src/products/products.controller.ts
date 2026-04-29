import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { ProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products with pagination, search, filters, and sort',
    description:
      'Search matches product name and description. Filter by category slug and price range. ' +
      'Default: page 1, 20 items, sorted by `createdAt` descending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products with embedded category.',
    type: PaginatedProductsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters.',
  })
  list(@Query() query: ListProductsQueryDto): Promise<PaginatedProductsDto> {
    return this.productsService.list(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single product by slug',
    description: 'Returns the product with its category, or 404 if not found.',
  })
  @ApiParam({
    name: 'slug',
    example: 'wireless-headphones',
    description: 'URL slug of the product.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product with category.',
    type: ProductDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No product with this slug.',
  })
  getBySlug(@Param('slug') slug: string): Promise<ProductDto> {
    return this.productsService.findBySlug(slug);
  }
}
