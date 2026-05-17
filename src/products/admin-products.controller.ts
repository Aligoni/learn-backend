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
import { Audit } from '../admin/audit.decorator';
import { AuditService } from '../admin/audit.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserPublicDto } from '../users/dto/user-public.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListAdminProductsQueryDto } from './dto/list-admin-products.query.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements.query.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { PaginatedStockMovementsDto } from './dto/paginated-stock-movements.dto';
import { ProductDto } from './dto/product.dto';
import { StockAdjustmentResultDto } from './dto/stock-adjustment-result.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { StockService } from './stock.service';

@ApiTags('admin-products')
@ApiBearerAuth('access-token')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
    private readonly auditService: AuditService,
  ) {}

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
  @Audit({ entityType: 'product', action: 'create' })
  @ApiOperation({
    summary: 'Create a product',
    description:
      'Slug auto-derived from `name` if omitted. Initial `stock` is recorded as a `StockMovement` ' +
      'with reason `initial` and the caller as the actor. Subsequent stock changes go through ' +
      'the stock endpoints below.',
  })
  @ApiResponse({ status: 201, type: ProductDto })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Category id does not exist.' })
  @ApiResponse({ status: 409, description: 'Slug already in use.' })
  create(
    @CurrentUser() user: UserPublicDto,
    @Body() dto: CreateProductDto,
  ): Promise<ProductDto> {
    return this.productsService.createProduct(dto, user.id);
  }

  @Patch(':id')
  @Audit({ entityType: 'product', action: 'update' })
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
  @Audit({ entityType: 'product', action: 'delete' })
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

  @Post(':id/stock')
  @ApiOperation({
    summary: 'Adjust product stock',
    description:
      "Applies a signed `delta` to the product's stock in a transaction and records the change " +
      'as a `StockMovement`. Stock cannot go negative (returns 400). Soft-deleted products are ' +
      'rejected (returns 400). This is the only supported way to change stock — `PATCH` ignores it.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, type: StockAdjustmentResultDto })
  @ApiResponse({
    status: 400,
    description:
      'Delta is zero/non-integer, would push stock negative, or product is deleted.',
  })
  @ApiResponse({ status: 404, description: 'No product with this id.' })
  async adjustStock(
    @CurrentUser() user: UserPublicDto,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdjustStockDto,
  ): Promise<StockAdjustmentResultDto> {
    const { movement } = await this.stockService.applyMovement({
      productId: id,
      delta: dto.delta,
      reason: dto.reason,
      actorUserId: user.id,
      note: dto.note,
    });
    const product = await this.productsService.getByIdForAdmin(id);
    const movementDto = this.stockService.toMovementDto(movement);
    await this.auditService.record({
      actorUserId: user.id,
      action: 'create',
      entityType: 'stock_movement',
      entityId: movement.id,
      after: movementDto as unknown as Record<string, unknown>,
    });
    return { product, movement: movementDto };
  }

  @Get(':id/stock/movements')
  @ApiOperation({
    summary: 'List stock movements for a product',
    description:
      'Paginated history, newest first. Optionally filter by `reason`.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: PaginatedStockMovementsDto })
  @ApiResponse({ status: 404, description: 'No product with this id.' })
  listMovements(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListStockMovementsQueryDto,
  ): Promise<PaginatedStockMovementsDto> {
    return this.stockService.listMovements(id, query);
  }
}
