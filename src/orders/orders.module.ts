import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { AuditFetcherRegistry } from '../admin/audit-fetcher.registry';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { ProductsModule } from '../products/products.module';
import { AdminOrdersController } from './admin-orders.controller';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      IdempotencyKey,
      Cart,
      CartItem,
    ]),
    AdminModule,
    ProductsModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule implements OnModuleInit {
  constructor(
    private readonly fetchers: AuditFetcherRegistry,
    private readonly ordersService: OrdersService,
  ) {}

  onModuleInit(): void {
    this.fetchers.register('order', async (id) => {
      try {
        const dto = await this.ordersService.getByIdForAdmin(id);
        return dto as unknown as Record<string, unknown>;
      } catch {
        return null;
      }
    });
  }
}
