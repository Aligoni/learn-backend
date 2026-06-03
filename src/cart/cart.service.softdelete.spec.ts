import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../products/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { User } from '../users/entities/user.entity';

/**
 * Reproduction for: TypeError: Cannot read properties of null (reading 'price')
 * at CartService.toCartItemDto.
 *
 * A product that is in someone's cart gets soft-deleted. The cart_item row
 * survives (soft-delete is an UPDATE, the onDelete: 'RESTRICT' FK never fires),
 * but the eager + soft-delete-aware load returns item.product === null.
 */
describe('CartService — product soft-deleted while in cart', () => {
  let dataSource: DataSource;
  let service: CartService;
  let products: Repository<Product>;
  let categories: Repository<Category>;
  let carts: Repository<Cart>;
  let items: Repository<CartItem>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getDataSourceToken(),
          useFactory: async () => {
            const ds = new DataSource({
              type: 'sqlite',
              database: ':memory:',
              entities: [User, Product, Category, Cart, CartItem],
              synchronize: true,
            });
            await ds.initialize();
            return ds;
          },
        },
        {
          provide: getRepositoryToken(Cart),
          useFactory: (ds: DataSource) => ds.getRepository(Cart),
          inject: [getDataSourceToken()],
        },
        {
          provide: getRepositoryToken(CartItem),
          useFactory: (ds: DataSource) => ds.getRepository(CartItem),
          inject: [getDataSourceToken()],
        },
        {
          provide: getRepositoryToken(Product),
          useFactory: (ds: DataSource) => ds.getRepository(Product),
          inject: [getDataSourceToken()],
        },
      ],
    }).compile();

    service = moduleRef.get(CartService);
    dataSource = moduleRef.get(getDataSourceToken());
    products = dataSource.getRepository(Product);
    categories = dataSource.getRepository(Category);
    carts = dataSource.getRepository(Cart);
    items = dataSource.getRepository(CartItem);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('does not crash getActiveCart when a cart product is soft-deleted', async () => {
    const category = await categories.save(
      categories.create({
        name: 'Electronics',
        slug: 'electronics',
        description: null,
      }),
    );
    const product = await products.save(
      products.create({
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'desc',
        imageUrl: 'http://img',
        price: 129.99,
        currency: 'USD',
        stock: 100,
        rating: 4.6,
        categoryId: category.id,
      }),
    );
    const cart = await carts.save(
      carts.create({ userId: null, sessionId: 'sess-1' }),
    );
    await items.save(
      items.create({ cartId: cart.id, productId: product.id, quantity: 2 }),
    );

    // Sanity: cart renders fine while product is live.
    const before = await service.getActiveCart(undefined, 'sess-1');
    expect(before.items).toHaveLength(1);

    // Admin soft-deletes the product (same call softDeleteProduct makes).
    await products.softDelete(product.id);

    // Previously threw "Cannot read properties of null (reading 'price')".
    // Now the orphaned line is dropped from the response...
    const after = await service.getActiveCart(undefined, 'sess-1');
    expect(after).toBeDefined();
    expect(after.items).toHaveLength(0);
    expect(after.subtotal).toBe(0);
    expect(after.totalItems).toBe(0);

    // ...and the stale cart_item row is pruned (self-heal). The delete is
    // fire-and-forget, so allow the microtask queue to flush.
    await new Promise((resolve) => setImmediate(resolve));
    expect(await items.count({ where: { cartId: cart.id } })).toBe(0);
  });
});
