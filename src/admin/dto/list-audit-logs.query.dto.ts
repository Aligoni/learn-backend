import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from '../entities/audit-log.entity';
import type {
  AuditAction,
  AuditEntityType,
} from '../entities/audit-log.entity';

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: AUDIT_ENTITY_TYPES })
  @IsOptional()
  @IsIn(AUDIT_ENTITY_TYPES, {
    message: `entityType must be one of: ${AUDIT_ENTITY_TYPES.join(', ')}`,
  })
  entityType?: AuditEntityType;

  @ApiPropertyOptional({
    description: 'Filter by a specific entity id (uuid).',
  })
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by actor.' })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({ enum: AUDIT_ACTIONS })
  @IsOptional()
  @IsIn(AUDIT_ACTIONS, {
    message: `action must be one of: ${AUDIT_ACTIONS.join(', ')}`,
  })
  action?: AuditAction;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'ISO datetime, inclusive lower bound.',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'ISO datetime, inclusive upper bound.',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
