import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { AuditFetcherRegistry } from '../admin/audit-fetcher.registry';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminProductsController } from './admin-products.controller';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StockService } from './stock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, StockMovement]),
    AdminModule,
  ],
  controllers: [
    ProductsController,
    CategoriesController,
    AdminProductsController,
    AdminCategoriesController,
  ],
  providers: [ProductsService, StockService],
  exports: [ProductsService, StockService],
})
export class ProductsModule implements OnModuleInit {
  constructor(
    private readonly fetchers: AuditFetcherRegistry,
    private readonly productsService: ProductsService,
  ) {}

  onModuleInit(): void {
    this.fetchers.register('product', async (id) => {
      try {
        const dto = await this.productsService.getByIdForAdmin(id);
        return dto as unknown as Record<string, unknown>;
      } catch {
        return null;
      }
    });
    this.fetchers.register('category', async (id) => {
      const dto = await this.productsService.findCategoryById(id);
      return dto ? (dto as unknown as Record<string, unknown>) : null;
    });
  }
}
