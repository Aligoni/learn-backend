import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { SettingsService } from '../admin/settings.service';
import { Setting } from '../admin/entities/setting.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Category } from '../products/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../products/entities/stock-movement.entity';
import { StockService } from '../products/stock.service';
import { User } from '../users/entities/user.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

const ENTITIES = [
  User,
  Product,
  Category,
  Cart,
  CartItem,
  StockMovement,
  Setting,
  Order,
  OrderItem,
  IdempotencyKey,
];

function repoProvider(entity: new () => object) {
  return {
    provide: getRepositoryToken(entity),
    useFactory: (ds: DataSource) => ds.getRepository(entity),
    inject: [getDataSourceToken()],
  };
}

describe('OrdersService — soft-delete & transaction behaviour', () => {
  let dataSource: DataSource;
  let orders: OrdersService;
  let stock: StockService;
  let products: Repository<Product>;
  let categories: Repository<Category>;
  let carts: Repository<Cart>;
  let items: Repository<CartItem>;
  let user: User;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        StockService,
        SettingsService,
        {
          provide: getDataSourceToken(),
          useFactory: async () => {
            const ds = new DataSource({
              type: 'sqlite',
              database: ':memory:',
              entities: ENTITIES,
              synchronize: true,
            });
            await ds.initialize();
            return ds;
          },
        },
        ...ENTITIES.map(repoProvider),
      ],
    }).compile();

    dataSource = moduleRef.get(getDataSourceToken());
    orders = moduleRef.get(OrdersService);
    stock = moduleRef.get(StockService);
    products = dataSource.getRepository(Product);
    categories = dataSource.getRepository(Category);
    carts = dataSource.getRepository(Cart);
    items = dataSource.getRepository(CartItem);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean slate between tests. Delete children before parents to respect FKs.
    const ORDERED = [
      OrderItem,
      Order,
      IdempotencyKey,
      StockMovement,
      CartItem,
      Cart,
      Product,
      Category,
      Setting,
      User,
    ];
    for (const e of ORDERED) {
      await dataSource.getRepository(e).createQueryBuilder().delete().execute();
    }
    user = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        name: 'Buyer',
        email: `buyer-${Math.random()}@x.com`,
        passwordHash: 'x',
        role: 'user',
      }),
    );
  });

  async function makeProduct(
    overrides: Partial<Product> = {},
  ): Promise<Product> {
    const category = await categories.save(
      categories.create({
        name: 'Cat',
        slug: `cat-${Math.random()}`,
        description: null,
      }),
    );
    return products.save(
      products.create({
        name: 'Thing',
        slug: `thing-${Math.random()}`,
        description: 'd',
        imageUrl: 'http://i',
        price: 10,
        currency: 'USD',
        stock: 5,
        rating: 4,
        categoryId: category.id,
        ...overrides,
      }),
    );
  }

  async function addToCart(product: Product, quantity: number): Promise<void> {
    // A user has at most one cart (unique user_id), so reuse the existing one.
    const cart =
      (await carts.findOne({ where: { userId: user.id } })) ??
      (await carts.save(carts.create({ userId: user.id, sessionId: null })));
    await items.save(
      items.create({ cartId: cart.id, productId: product.id, quantity }),
    );
  }

  it('checkout decrements stock inside the same transaction', async () => {
    const product = await makeProduct({ stock: 5 });
    await addToCart(product, 2);

    const order = await orders.checkout(user.id, 'idem-1', {});
    expect(order.items).toHaveLength(1);

    const fresh = await products.findOneByOrFail({ id: product.id });
    expect(fresh.stock).toBe(3);
  });

  it('checkout fails cleanly (400, not 500) when a cart product is soft-deleted', async () => {
    const product = await makeProduct({ stock: 5 });
    await addToCart(product, 2);
    await products.softDelete(product.id);

    await expect(orders.checkout(user.id, 'idem-2', {})).rejects.toThrow(
      /no longer available/i,
    );

    // Stock untouched, no order/movement written (transaction rolled back).
    const fresh = await products.findOne({
      where: { id: product.id },
      withDeleted: true,
    });
    expect(fresh?.stock).toBe(5);
    expect(await dataSource.getRepository(Order).count()).toBe(0);
    expect(await dataSource.getRepository(StockMovement).count()).toBe(0);
  });

  it('cancel releases stock even when the product was later soft-deleted', async () => {
    const product = await makeProduct({ stock: 5 });
    await addToCart(product, 2);
    const order = await orders.checkout(user.id, 'idem-3', {});
    expect((await products.findOneByOrFail({ id: product.id })).stock).toBe(3);

    // Product is discontinued after the sale.
    await products.softDelete(product.id);

    // Previously threw "Cannot adjust stock for a deleted product" and left the
    // order stuck. Now it completes and returns the stock.
    const cancelled = await orders.changeStatusAsAdmin(
      order.id,
      'cancelled',
      user.id,
    );
    expect(cancelled.status).toBe('cancelled');

    const after = await products.findOne({
      where: { id: product.id },
      withDeleted: true,
    });
    expect(after?.stock).toBe(5);
  });

  it('manual stock adjustment on a deleted product is still rejected', async () => {
    const product = await makeProduct({ stock: 5 });
    await products.softDelete(product.id);

    await expect(
      stock.applyMovement({
        productId: product.id,
        delta: 3,
        reason: 'adjustment',
      }),
    ).rejects.toThrow(/deleted product/i);
  });

  it('replays the same order for a repeated idempotency key (pre-flight path)', async () => {
    const product = await makeProduct({ stock: 5 });
    await addToCart(product, 2);
    const first = await orders.checkout(user.id, 'idem-replay', {});

    // Same key again — cart is now empty, but the pre-flight replay short-circuit
    // returns the original order rather than erroring on the empty cart.
    const second = await orders.checkout(user.id, 'idem-replay', {});
    expect(second.id).toBe(first.id);

    // Exactly one order and one stock decrement happened.
    expect(await dataSource.getRepository(Order).count()).toBe(1);
    expect((await products.findOneByOrFail({ id: product.id })).stock).toBe(3);
  });

  it('returns the winner order (not a 409) when the idempotency insert races', async () => {
    // Winner: a committed order + idempotency row for key K.
    const productA = await makeProduct({ stock: 5 });
    await addToCart(productA, 1);
    const winner = await orders.checkout(user.id, 'idem-race', {});

    // Loser: a fresh cart, same key. Force the pre-flight check to MISS so we
    // exercise the in-transaction collision path (the real concurrency window).
    const productB = await makeProduct({ stock: 5 });
    await addToCart(productB, 1);
    const findOneSpy = jest
      .spyOn(dataSource.getRepository(IdempotencyKey), 'findOne')
      .mockResolvedValueOnce(null); // pre-flight miss only; later lookup is real

    const result = await orders.checkout(user.id, 'idem-race', {});

    // Got the winner's order back, no duplicate created, loser's stock untouched.
    expect(result.id).toBe(winner.id);
    expect(await dataSource.getRepository(Order).count()).toBe(1);
    expect((await products.findOneByOrFail({ id: productB.id })).stock).toBe(5);

    findOneSpy.mockRestore();
  });
});
