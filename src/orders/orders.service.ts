import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { SettingsService } from '../admin/settings.service';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../products/entities/product.entity';
import { StockService } from '../products/stock.service';
import { CheckoutDto } from './dto/checkout.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { OrderDto } from './dto/order.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

const STATUSES_THAT_RELEASE_STOCK: OrderStatus[] = ['cancelled', 'refunded'];

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly stockService: StockService,
    private readonly settingsService: SettingsService,
  ) {}

  toItemDto(item: OrderItem): OrderItemDto {
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      currency: item.currency,
      productName: item.productName,
      productSlug: item.productSlug,
      productImageUrl: item.productImageUrl,
      createdAt: item.createdAt,
    };
  }

  toDto(order: Order): OrderDto {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      currency: order.currency,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      notes: order.notes,
      items: (order.items ?? []).map((i) => this.toItemDto(i)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // ---- Checkout -----------------------------------------------------------

  async checkout(
    userId: string,
    idempotencyKey: string,
    dto: CheckoutDto,
  ): Promise<OrderDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    const replay = await this.idempotencyRepo.findOne({
      where: { userId, key: idempotencyKey },
    });
    if (replay) {
      return this.loadOrderForUser(replay.orderId, userId);
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const cart = await this.loadActiveCartForCheckout(manager, userId);

      const currency = cart.items[0].product.currency;
      for (const item of cart.items) {
        if (item.product.currency !== currency) {
          throw new BadRequestException(
            `Cart mixes currencies (${currency} vs ${item.product.currency}). Checkout requires a single currency.`,
          );
        }
        if (item.product.deletedAt) {
          throw new BadRequestException(
            `Product "${item.product.name}" is no longer available.`,
          );
        }
        if (item.quantity > item.product.stock) {
          throw new BadRequestException(
            `Insufficient stock for "${item.product.name}": requested ${item.quantity}, available ${item.product.stock}.`,
          );
        }
      }

      const shippingFeeCents = await this.settingsService.getShippingFeeCents();
      const shippingFee = roundMoney(shippingFeeCents / 100);
      const subtotal = roundMoney(
        cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      );
      const total = roundMoney(subtotal + shippingFee);

      const orderEntity = manager.create(Order, {
        userId,
        status: 'pending',
        currency,
        subtotal,
        shippingFee,
        total,
        notes: dto.notes?.trim() || null,
        items: cart.items.map((i) =>
          manager.create(OrderItem, {
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: i.product.price,
            lineTotal: roundMoney(i.product.price * i.quantity),
            currency: i.product.currency,
            productName: i.product.name,
            productSlug: i.product.slug,
            productImageUrl: i.product.imageUrl,
          }),
        ),
      });
      const savedOrder = await manager.save(Order, orderEntity);

      for (const item of cart.items) {
        await this.stockService.applyMovement({
          productId: item.product.id,
          delta: -item.quantity,
          reason: 'sale',
          actorUserId: userId,
          note: `order:${savedOrder.id}`,
        });
      }

      await manager.delete(CartItem, { cartId: cart.id });

      try {
        await manager.save(
          manager.create(IdempotencyKey, {
            key: idempotencyKey,
            userId,
            orderId: savedOrder.id,
          }),
        );
      } catch {
        throw new ConflictException(
          'A concurrent checkout with the same Idempotency-Key is in progress. Retry shortly.',
        );
      }

      return savedOrder;
    });

    return this.loadOrderForUser(order.id, userId);
  }

  // ---- User-facing reads --------------------------------------------------

  async findMine(
    userId: string,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    return this.listInternal({ ...query, userId, _ignoreQueryUserId: true });
  }

  async findMineById(userId: string, orderId: string): Promise<OrderDto> {
    return this.loadOrderForUser(orderId, userId);
  }

  async payAsUser(userId: string, orderId: string): Promise<OrderDto> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`No order with id ${orderId}.`);
    }
    if (order.status !== 'pending') {
      throw new ConflictException(
        `Order is already ${order.status}; only pending orders can be paid.`,
      );
    }
    order.status = 'paid';
    await this.ordersRepo.save(order);
    return this.loadOrderForUser(orderId, userId);
  }

  // ---- Admin --------------------------------------------------------------

  async listForAdmin(query: ListOrdersQueryDto): Promise<PaginatedOrdersDto> {
    return this.listInternal({ ...query });
  }

  async getByIdForAdmin(id: string): Promise<OrderDto> {
    const order = await this.loadOrderById(id);
    return this.toDto(order);
  }

  async changeStatusAsAdmin(
    orderId: string,
    target: OrderStatus,
    actorUserId: string,
  ): Promise<OrderDto> {
    const order = await this.loadOrderById(orderId);
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(target)) {
      throw new ConflictException(
        `Invalid transition: ${order.status} → ${target}. Allowed: ${
          allowed.length ? allowed.join(', ') : '(terminal state)'
        }.`,
      );
    }

    if (STATUSES_THAT_RELEASE_STOCK.includes(target)) {
      for (const item of order.items) {
        await this.stockService.applyMovement({
          productId: item.productId,
          delta: item.quantity,
          reason: 'return',
          actorUserId,
          note: `order:${order.id} status→${target}`,
        });
      }
    }

    order.status = target;
    await this.ordersRepo.save(order);
    return this.getByIdForAdmin(orderId);
  }

  // ---- Helpers ------------------------------------------------------------

  private async loadActiveCartForCheckout(
    manager: EntityManager,
    userId: string,
  ): Promise<Cart & { items: (CartItem & { product: Product })[] }> {
    const cart = await manager.findOne(Cart, {
      where: { userId },
      relations: ['items', 'items.product'],
      order: { items: { createdAt: 'ASC' } },
    });
    if (!cart) {
      throw new BadRequestException('You have no active cart to check out.');
    }
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }
    return cart as Cart & { items: (CartItem & { product: Product })[] };
  }

  private async loadOrderById(id: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['items'],
      order: { items: { createdAt: 'ASC' } },
    });
    if (!order) {
      throw new NotFoundException(`No order with id ${id}.`);
    }
    return order;
  }

  private async loadOrderForUser(
    orderId: string,
    userId: string,
  ): Promise<OrderDto> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
      order: { items: { createdAt: 'ASC' } },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`No order with id ${orderId}.`);
    }
    return this.toDto(order);
  }

  private async listInternal(
    query: ListOrdersQueryDto & {
      userId?: string;
      _ignoreQueryUserId?: boolean;
    },
  ): Promise<PaginatedOrdersDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to) where.createdAt = Between(from, to);
    else if (from) where.createdAt = MoreThanOrEqual(from);
    else if (to) where.createdAt = LessThanOrEqual(to);

    const [rows, total] = await this.ordersRepo.findAndCount({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
      items: rows.map((r) => this.toDto(r)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }
}
