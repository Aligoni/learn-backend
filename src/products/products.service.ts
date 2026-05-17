import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { slugify, SLUG_PATTERN } from '../common/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { StockService } from './stock.service';
import { CategoryDto } from './dto/category.dto';
import {
  ListProductsQueryDto,
  ProductSortBy,
  ProductSortOrder,
} from './dto/list-products.query.dto';
import { ListAdminProductsQueryDto } from './dto/list-admin-products.query.dto';
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
    private readonly stockService: StockService,
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
      deletedAt: product.deletedAt,
    };
  }

  async findAllCategories(): Promise<CategoryDto[]> {
    const categories = await this.categoriesRepo.find({
      order: { name: 'ASC' },
    });
    return categories.map((c) => this.toCategoryDto(c));
  }

  async findCategoryById(id: string): Promise<CategoryDto | null> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    return category ? this.toCategoryDto(category) : null;
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
      .innerJoinAndSelect('p.category', 'c')
      .where('p.deletedAt IS NULL');

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

  // ---- Admin: categories --------------------------------------------------

  async createCategory(dto: CreateCategoryDto): Promise<CategoryDto> {
    const name = dto.name.trim();
    const slug = this.normalizeSlug(dto.slug, name);
    await this.ensureCategorySlugUnique(slug);
    const entity = this.categoriesRepo.create({
      name,
      slug,
      description: dto.description?.trim() || null,
    });
    const saved = await this.categoriesRepo.save(entity);
    return this.toCategoryDto(saved);
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`No category with id ${id}.`);
    }
    if (dto.name !== undefined) {
      category.name = dto.name.trim();
    }
    if (dto.slug !== undefined) {
      const newSlug = this.normalizeSlug(dto.slug, category.name);
      if (newSlug !== category.slug) {
        await this.ensureCategorySlugUnique(newSlug);
        category.slug = newSlug;
      }
    }
    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || null;
    }
    const saved = await this.categoriesRepo.save(category);
    return this.toCategoryDto(saved);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`No category with id ${id}.`);
    }
    const productCount = await this.productsRepo.count({
      where: { categoryId: id },
      withDeleted: true,
    });
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.name}": ${productCount} product(s) still reference it. Move or delete those products first.`,
      );
    }
    await this.categoriesRepo.remove(category);
  }

  // ---- Admin: products ----------------------------------------------------

  async listForAdmin(
    query: ListAdminProductsQueryDto,
  ): Promise<PaginatedProductsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? ProductSortBy.createdAt;
    const sortOrder = query.sortOrder ?? ProductSortOrder.desc;

    const qb = this.productsRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.category', 'c')
      .withDeleted();

    if (query.includeDeleted === false) {
      qb.andWhere('p.deletedAt IS NULL');
    } else if (query.onlyDeleted === true) {
      qb.andWhere('p.deletedAt IS NOT NULL');
    }

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

    const column = SORT_COLUMN[sortBy];
    qb.orderBy(`p.${column}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
      items: items.map((p) => this.toProductDto(p)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page * limit < total,
    };
  }

  async getByIdForAdmin(id: string): Promise<ProductDto> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['category'],
      withDeleted: true,
    });
    if (!product) {
      throw new NotFoundException(`No product with id ${id}.`);
    }
    return this.toProductDto(product);
  }

  async createProduct(
    dto: CreateProductDto,
    actorUserId: string,
  ): Promise<ProductDto> {
    const category = await this.categoriesRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`No category with id ${dto.categoryId}.`);
    }
    const name = dto.name.trim();
    const slug = this.normalizeSlug(dto.slug, name);
    await this.ensureProductSlugUnique(slug);
    const entity = this.productsRepo.create({
      name,
      slug,
      description: dto.description.trim(),
      imageUrl: dto.imageUrl?.trim() || this.defaultImageUrl(slug),
      price: dto.price,
      currency: dto.currency?.trim().toUpperCase() || 'USD',
      stock: 0,
      rating: dto.rating ?? 0,
      categoryId: category.id,
    });
    const saved = await this.productsRepo.save(entity);

    if (dto.stock > 0) {
      await this.stockService.applyMovement({
        productId: saved.id,
        delta: dto.stock,
        reason: 'initial',
        actorUserId,
        note: 'Initial inventory on product creation.',
      });
    }
    return this.getByIdForAdmin(saved.id);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<ProductDto> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['category'],
      withDeleted: true,
    });
    if (!product) {
      throw new NotFoundException(`No product with id ${id}.`);
    }
    if (dto.name !== undefined) {
      product.name = dto.name.trim();
    }
    if (dto.slug !== undefined) {
      const newSlug = this.normalizeSlug(dto.slug, product.name);
      if (newSlug !== product.slug) {
        await this.ensureProductSlugUnique(newSlug);
        product.slug = newSlug;
      }
    }
    if (dto.description !== undefined) {
      product.description = dto.description.trim();
    }
    if (dto.imageUrl !== undefined) {
      product.imageUrl = dto.imageUrl.trim();
    }
    if (dto.price !== undefined) {
      product.price = dto.price;
    }
    if (dto.currency !== undefined) {
      product.currency = dto.currency.trim().toUpperCase();
    }
    if (dto.rating !== undefined) {
      product.rating = dto.rating;
    }
    if (dto.categoryId !== undefined && dto.categoryId !== product.categoryId) {
      const cat = await this.categoriesRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!cat) {
        throw new NotFoundException(`No category with id ${dto.categoryId}.`);
      }
      product.categoryId = cat.id;
      product.category = cat;
    }
    const saved = await this.productsRepo.save(product);
    return this.getByIdForAdmin(saved.id);
  }

  async softDeleteProduct(id: string): Promise<ProductDto> {
    const product = await this.productsRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!product) {
      throw new NotFoundException(`No product with id ${id}.`);
    }
    if (product.deletedAt) {
      throw new ConflictException(`Product ${id} is already deleted.`);
    }
    await this.productsRepo.softDelete(id);
    return this.getByIdForAdmin(id);
  }

  // ---- helpers ------------------------------------------------------------

  private normalizeSlug(
    provided: string | undefined,
    fallback: string,
  ): string {
    const candidate = (provided?.trim() || slugify(fallback)).toLowerCase();
    if (!candidate) {
      throw new ConflictException(
        'Could not derive a valid slug. Provide one explicitly.',
      );
    }
    if (!SLUG_PATTERN.test(candidate)) {
      throw new ConflictException(
        `Invalid slug "${candidate}": use lowercase letters, digits, and single dashes.`,
      );
    }
    return candidate;
  }

  private async ensureCategorySlugUnique(slug: string): Promise<void> {
    const existing = await this.categoriesRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(
        `A category with slug "${slug}" already exists.`,
      );
    }
  }

  private async ensureProductSlugUnique(slug: string): Promise<void> {
    const existing = await this.productsRepo.findOne({
      where: { slug },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(
        `A product with slug "${slug}" already exists.`,
      );
    }
  }

  private defaultImageUrl(slug: string): string {
    return `https://picsum.photos/seed/${encodeURIComponent(slug)}/600/400`;
  }
}
