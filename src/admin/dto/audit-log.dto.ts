import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from '../entities/audit-log.entity';
import type {
  AuditAction,
  AuditEntityType,
} from '../entities/audit-log.entity';

export class AuditLogDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Admin who performed the action.',
  })
  actorUserId: string;

  @ApiProperty({ enum: AUDIT_ACTIONS })
  action: AuditAction;

  @ApiProperty({ enum: AUDIT_ENTITY_TYPES })
  entityType: AuditEntityType;

  @ApiProperty({
    description: 'Id of the affected entity (uuid in current entities).',
  })
  entityId: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Snapshot before the change. `null` on create.',
  })
  before: Record<string, unknown> | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Snapshot after the change. `null` on delete.',
  })
  after: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
