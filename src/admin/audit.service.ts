import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuditLogDto } from './dto/audit-log.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';
import { PaginatedAuditLogsDto } from './dto/paginated-audit-logs.dto';
import {
  AuditAction,
  AuditEntityType,
  AuditLog,
} from './entities/audit-log.entity';

export interface RecordAuditInput {
  actorUserId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  toDto(log: AuditLog): AuditLogDto {
    return {
      id: log.id,
      actorUserId: log.actorUserId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      before: log.before,
      after: log.after,
      createdAt: log.createdAt,
    };
  }

  async record(input: RecordAuditInput): Promise<AuditLog> {
    const entity = this.auditRepo.create({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ?? null,
      after: input.after ?? null,
    });
    return this.auditRepo.save(entity);
  }

  async list(query: ListAuditLogsQueryDto): Promise<PaginatedAuditLogsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.action) where.action = query.action;

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to) where.createdAt = Between(from, to);
    else if (from) where.createdAt = MoreThanOrEqual(from);
    else if (to) where.createdAt = LessThanOrEqual(to);

    const [rows, total] = await this.auditRepo.findAndCount({
      where,
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

  async getById(id: string): Promise<AuditLogDto> {
    const log = await this.auditRepo.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`No audit log with id ${id}.`);
    }
    return this.toDto(log);
  }
}
