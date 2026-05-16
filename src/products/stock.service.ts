import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements.query.dto';
import { PaginatedStockMovementsDto } from './dto/paginated-stock-movements.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { Product } from './entities/product.entity';
import {
  StockMovement,
  StockMovementReason,
} from './entities/stock-movement.entity';

export interface ApplyMovementInput {
  productId: string;
  delta: number;
  reason: StockMovementReason;
  actorUserId?: string | null;
  note?: string | null;
}

export interface ApplyMovementResult {
  movement: StockMovement;
  newStock: number;
}

@Injectable()
export class StockService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(StockMovement)
    private readonly movementsRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  toMovementDto(m: StockMovement): StockMovementDto {
    return {
      id: m.id,
      productId: m.productId,
      delta: m.delta,
      reason: m.reason,
      note: m.note,
      actorUserId: m.actorUserId,
      createdAt: m.createdAt,
    };
  }

  async listMovements(
    productId: string,
    query: ListStockMovementsQueryDto,
  ): Promise<PaginatedStockMovementsDto> {
    const product = await this.productsRepo.findOne({
      where: { id: productId },
      withDeleted: true,
    });
    if (!product) {
      throw new NotFoundException(`No product with id ${productId}.`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.movementsRepo
      .createQueryBuilder('m')
      .where('m.productId = :productId', { productId })
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.reason) {
      qb.andWhere('m.reason = :reason', { reason: query.reason });
    }

    const [rows, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
      items: rows.map((r) => this.toMovementDto(r)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  async applyMovement(input: ApplyMovementInput): Promise<ApplyMovementResult> {
    if (!Number.isInteger(input.delta) || input.delta === 0) {
      throw new BadRequestException(
        'Stock delta must be a non-zero integer (positive to add, negative to remove).',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: input.productId },
        withDeleted: true,
      });
      if (!product) {
        throw new NotFoundException(`No product with id ${input.productId}.`);
      }
      if (product.deletedAt) {
        throw new BadRequestException(
          'Cannot adjust stock for a deleted product.',
        );
      }

      const next = product.stock + input.delta;
      if (next < 0) {
        throw new BadRequestException(
          `Stock cannot go negative. Current=${product.stock}, delta=${input.delta}.`,
        );
      }

      product.stock = next;
      await manager.save(Product, product);

      const movement = manager.create(StockMovement, {
        productId: product.id,
        delta: input.delta,
        reason: input.reason,
        actorUserId: input.actorUserId ?? null,
        note: input.note?.trim() || null,
      });
      const saved = await manager.save(StockMovement, movement);

      return { movement: saved, newStock: next };
    });
  }
}
