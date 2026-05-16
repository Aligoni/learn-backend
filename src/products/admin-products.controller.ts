import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ListAdminProductsQueryDto } from './dto/list-admin-products.query.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('admin-products')
@ApiBearerAuth('access-token')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products (admin view)',
    description:
      'Paginated list. Includes soft-deleted products by default — set `includeDeleted=false` ' +
      'to hide them, or `onlyDeleted=true` to see only soft-deleted entries.',
  })
  @ApiResponse({ status: 200, type: PaginatedProductsDto })
  list(
    @Query() query: ListAdminProductsQueryDto,
  ): Promise<PaginatedProductsDto> {
    return this.productsService.listForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a product by id (admin view, includes soft-deleted)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProductDto })
  @ApiResponse({ status: 404, description: 'No product with this id.' })
  getById(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProductDto> {
    return this.productsService.getByIdForAdmin(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a product',
    description:
      'Slug auto-derived from `name` if omitted. Stock is the initial inventory; subsequent ' +
      'changes go through stock-management endpoints in a later phase.',
  })
  @ApiResponse({ status: 201, type: ProductDto })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Category id does not exist.' })
  @ApiResponse({ status: 409, description: 'Slug already in use.' })
  create(@Body() dto: CreateProductDto): Promise<ProductDto> {
    return this.productsService.createProduct(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a product',
    description:
      'Every field except `stock` is editable. Use the stock endpoints to change inventory.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProductDto })
  @ApiResponse({
    status: 404,
    description: 'No product with this id, or new category id missing.',
  })
  @ApiResponse({ status: 409, description: 'Slug already in use.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete a product',
    description:
      'Marks the product as deleted (sets `deletedAt`) so it disappears from public endpoints ' +
      'but remains visible to admins and referenceable by historical orders.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: ProductDto,
    description: 'Product with `deletedAt` populated.',
  })
  @ApiResponse({ status: 404, description: 'No product with this id.' })
  @ApiResponse({ status: 409, description: 'Product is already deleted.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProductDto> {
    return this.productsService.softDeleteProduct(id);
  }
}
