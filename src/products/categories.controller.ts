import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryDto } from './dto/category.dto';
import { ProductsService } from './products.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all product categories',
    description:
      'Returns every category, sorted by name. Use `slug` with `GET /products?categorySlug=...` to filter products.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories.',
    type: [CategoryDto],
  })
  list(): Promise<CategoryDto[]> {
    return this.productsService.findAllCategories();
  }
}
