import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { AdminModule } from './admin/admin.module';
import { AuditLog } from './admin/entities/audit-log.entity';
import { Setting } from './admin/entities/setting.entity';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CartItem } from './cart/entities/cart-item.entity';
import { Cart } from './cart/entities/cart.entity';
import { Category } from './products/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { StockMovement } from './products/entities/stock-movement.entity';
import { ProductsModule } from './products/products.module';
import { IdempotencyKey } from './orders/entities/idempotency-key.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Order } from './orders/entities/order.entity';
import { OrdersModule } from './orders/orders.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const database =
          config.get<string>('DATABASE_PATH') ?? './data/dev.sqlite';
        if (!database.startsWith(':memory:')) {
          const dir = dirname(database);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
        }
        const nodeEnv = config.get<string>('NODE_ENV');
        const synchronize = nodeEnv !== 'production';
        return {
          type: 'sqlite',
          database,
          entities: [
            User,
            Product,
            Category,
            Cart,
            CartItem,
            StockMovement,
            AuditLog,
            Setting,
            Order,
            OrderItem,
            IdempotencyKey,
          ],
          synchronize,
          logging: nodeEnv === 'development',
        };
      },
    }),
    AdminModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
  ],
})
export class AppModule {}
