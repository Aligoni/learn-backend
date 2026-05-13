import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import type { UserPublicDto } from '../users/dto/user-public.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartDto } from './dto/cart.dto';
import { CartItemDto } from './dto/cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';

interface ResolveOptions {
  createIfMissing: boolean;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartsRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemsRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getActiveCart(
    user: UserPublicDto | undefined,
    sessionId: string | undefined,
  ): Promise<CartDto> {
    const cart = await this.resolveActiveCart(user, sessionId, {
      createIfMissing: false,
    });
    if (!cart) {
      return this.emptyTransientCart(user);
    }
    const hydrated = await this.loadCartById(cart.id);
    return this.toCartDto(hydrated);
  }

  async addItem(
    user: UserPublicDto | undefined,
    sessionId: string | undefined,
    dto: AddCartItemDto,
  ): Promise<CartDto> {
    const product = await this.productsRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with id "${dto.productId}" not found.`,
      );
    }

    const cart = await this.resolveActiveCart(user, sessionId, {
      createIfMissing: true,
    });
    if (!cart) {
      throw new Error('resolveActiveCart returned null with createIfMissing');
    }

    const existing = await this.itemsRepo.findOne({
      where: { cartId: cart.id, productId: product.id },
    });

    const currentQty = existing?.quantity ?? 0;
    const targetQty = currentQty + dto.quantity;
    this.assertWithinStock(targetQty, product);

    if (existing) {
      existing.quantity = targetQty;
      await this.itemsRepo.save(existing);
    } else {
      await this.itemsRepo.save(
        this.itemsRepo.create({
          cartId: cart.id,
          productId: product.id,
          quantity: targetQty,
        }),
      );
    }

    const refreshed = await this.loadCartById(cart.id);
    return this.toCartDto(refreshed);
  }

  async updateItem(
    user: UserPublicDto | undefined,
    sessionId: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDto> {
    const cart = await this.resolveActiveCart(user, sessionId, {
      createIfMissing: false,
    });
    if (!cart) {
      throw new NotFoundException('No active cart.');
    }
    const item = await this.itemsRepo.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: ['product'],
    });
    if (!item) {
      throw new NotFoundException(`Cart item "${itemId}" not found.`);
    }
    this.assertWithinStock(dto.quantity, item.product);
    item.quantity = dto.quantity;
    await this.itemsRepo.save(item);
    const refreshed = await this.loadCartById(cart.id);
    return this.toCartDto(refreshed);
  }

  async removeItem(
    user: UserPublicDto | undefined,
    sessionId: string | undefined,
    itemId: string,
  ): Promise<CartDto> {
    const cart = await this.resolveActiveCart(user, sessionId, {
      createIfMissing: false,
    });
    if (!cart) {
      throw new NotFoundException('No active cart.');
    }
    const result = await this.itemsRepo.delete({ id: itemId, cartId: cart.id });
    if (!result.affected) {
      throw new NotFoundException(`Cart item "${itemId}" not found.`);
    }
    const refreshed = await this.loadCartById(cart.id);
    return this.toCartDto(refreshed);
  }

  async clear(
    user: UserPublicDto | undefined,
    sessionId: string | undefined,
  ): Promise<CartDto> {
    const cart = await this.resolveActiveCart(user, sessionId, {
      createIfMissing: false,
    });
    if (!cart) {
      return this.emptyTransientCart(user);
    }
    await this.itemsRepo.delete({ cartId: cart.id });
    const refreshed = await this.loadCartById(cart.id);
    return this.toCartDto(refreshed);
  }

  async mergeGuestCart(guestSessionId: string, userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const cartsRepo = manager.getRepository(Cart);
      const itemsRepo = manager.getRepository(CartItem);
      const productsRepo = manager.getRepository(Product);

      const guestCart = await cartsRepo.findOne({
        where: { sessionId: guestSessionId },
        relations: ['items'],
      });
      if (!guestCart || guestCart.items.length === 0) {
        if (guestCart) {
          await cartsRepo.remove(guestCart);
        }
        return;
      }

      let userCart = await cartsRepo.findOne({
        where: { userId },
        relations: ['items'],
      });
      if (!userCart) {
        userCart = await cartsRepo.save(
          cartsRepo.create({ userId, sessionId: null }),
        );
        userCart.items = [];
      }

      for (const guestItem of guestCart.items) {
        const product = await productsRepo.findOne({
          where: { id: guestItem.productId },
        });
        if (!product) {
          continue;
        }
        const existing = userCart.items.find(
          (i) => i.productId === guestItem.productId,
        );
        if (existing) {
          const desired = existing.quantity + guestItem.quantity;
          const allowed = Math.min(desired, product.stock);
          if (allowed > existing.quantity) {
            existing.quantity = allowed;
            await itemsRepo.save(existing);
          }
        } else {
          const qty = Math.min(guestItem.quantity, product.stock);
          if (qty > 0) {
            await itemsRepo.save(
              itemsRepo.create({
                cartId: userCart.id,
                productId: product.id,
                quantity: qty,
              }),
            );
          }
        }
      }

      await cartsRepo.remove(guestCart);
    });
  }

  private async resolveActiveCart(
    user: UserPublicDto | undefined,
    sessionId: string | undefined,
    { createIfMissing }: ResolveOptions,
  ): Promise<Cart | null> {
    if (user) {
      const existing = await this.cartsRepo.findOne({
        where: { userId: user.id },
      });
      if (existing) return existing;
      if (!createIfMissing) return null;
      return this.cartsRepo.save(
        this.cartsRepo.create({ userId: user.id, sessionId: null }),
      );
    }

    if (sessionId) {
      const existing = await this.cartsRepo.findOne({ where: { sessionId } });
      if (existing) return existing;
      if (!createIfMissing) return null;
      return this.cartsRepo.save(
        this.cartsRepo.create({ userId: null, sessionId }),
      );
    }

    if (!createIfMissing) return null;
    return this.cartsRepo.save(
      this.cartsRepo.create({ userId: null, sessionId: randomUUID() }),
    );
  }

  private async loadCartById(cartId: string): Promise<Cart> {
    const cart = await this.cartsRepo.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product', 'items.product.category'],
      order: { items: { createdAt: 'ASC' } },
    });
    if (!cart) {
      throw new NotFoundException(`Cart "${cartId}" not found.`);
    }
    return cart;
  }

  private assertWithinStock(quantity: number, product: Product): void {
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Requested quantity ${quantity} exceeds available stock (${product.stock}) for "${product.name}".`,
      );
    }
  }

  private toCartItemDto(item: CartItem): CartItemDto {
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      lineTotal: roundMoney(item.quantity * item.product.price),
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        description: item.product.description,
        imageUrl: item.product.imageUrl,
        price: item.product.price,
        currency: item.product.currency,
        stock: item.product.stock,
        rating: item.product.rating,
        category: {
          id: item.product.category.id,
          name: item.product.category.name,
          slug: item.product.category.slug,
          description: item.product.category.description,
          createdAt: item.product.category.createdAt,
        },
        createdAt: item.product.createdAt,
        updatedAt: item.product.updatedAt,
      },
    };
  }

  private toCartDto(cart: Cart): CartDto {
    const items = (cart.items ?? []).map((i) => this.toCartItemDto(i));
    const subtotal = roundMoney(items.reduce((sum, i) => sum + i.lineTotal, 0));
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const currency = items[0]?.product.currency ?? null;
    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      items,
      totalItems,
      subtotal,
      currency,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private emptyTransientCart(user: UserPublicDto | undefined): CartDto {
    return {
      id: null,
      userId: user?.id ?? null,
      sessionId: null,
      items: [],
      totalItems: 0,
      subtotal: 0,
      currency: null,
      createdAt: null,
      updatedAt: null,
    };
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
