import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditAction = 'create' | 'update' | 'delete';

export const AUDIT_ACTIONS: AuditAction[] = ['create', 'update', 'delete'];

export type AuditEntityType =
  | 'user'
  | 'category'
  | 'product'
  | 'stock_movement'
  | 'order'
  | 'setting';

export const AUDIT_ENTITY_TYPES: AuditEntityType[] = [
  'user',
  'category',
  'product',
  'stock_movement',
  'order',
  'setting',
];

@Entity('audit_logs')
@Index(['entityType', 'entityId', 'createdAt'])
@Index(['actorUserId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_user_id', type: 'varchar', length: 36 })
  actorUserId: string;

  @Column({ type: 'varchar', length: 16 })
  action: AuditAction;

  @Column({ name: 'entity_type', type: 'varchar', length: 32 })
  entityType: AuditEntityType;

  @Column({ name: 'entity_id', type: 'varchar', length: 64 })
  entityId: string;

  @Column({ type: 'simple-json', nullable: true })
  before: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  after: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
