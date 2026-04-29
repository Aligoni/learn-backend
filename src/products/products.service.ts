import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { CategoryDto } from './dto/category.dto';
import {
  ListProductsQueryDto,
  ProductSortBy,
  ProductSortOrder,
} from './dto/list-products.query.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { ProductDto } from './dto/product.dto';

const SORT_COLUMN: Record<ProductSortBy, string> = {
  [ProductSortBy.createdAt]: 'createdAt',
  [ProductSortBy.name]: 'name',
  [ProductSortBy.price]: 'price',
  [ProductSortBy.rating]: 'rating',
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  toCategoryDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
    };
  }

  toProductDto(product: Product): ProductDto {
    if (!product.category) {
      throw new Error('Product must load category for mapping');
    }
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      currency: product.currency,
      stock: product.stock,
      rating: product.rating,
      category: this.toCategoryDto(product.category),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async findAllCategories(): Promise<CategoryDto[]> {
    const categories = await this.categoriesRepo.find({
      order: { name: 'ASC' },
    });
    return categories.map((c) => this.toCategoryDto(c));
  }

  async findBySlug(slug: string): Promise<ProductDto> {
    const product = await this.productsRepo.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return this.toProductDto(product);
  }

  async list(query: ListProductsQueryDto): Promise<PaginatedProductsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? ProductSortBy.createdAt;
    const sortOrder = query.sortOrder ?? ProductSortOrder.desc;

    const qb = this.productsRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.category', 'c');

    const q = query.q?.trim();
    if (q) {
      const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      qb.andWhere(
        '(LOWER(p.name) LIKE LOWER(:like) ESCAPE :escape OR LOWER(p.description) LIKE LOWER(:like) ESCAPE :escape)',
        { like, escape: '\\' },
      );
    }

    if (query.categorySlug?.trim()) {
      qb.andWhere('c.slug = :categorySlug', {
        categorySlug: query.categorySlug.trim(),
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    const column = SORT_COLUMN[sortBy];
    qb.orderBy(`p.${column}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const hasNextPage = page * limit < total;

    return {
      items: items.map((p) => this.toProductDto(p)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
    };
  }
}
