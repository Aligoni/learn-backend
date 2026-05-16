import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

export type StockMovementReason =
  | 'initial'
  | 'restock'
  | 'adjustment'
  | 'sale'
  | 'return'
  | 'admin_correction';

export const STOCK_MOVEMENT_REASONS: StockMovementReason[] = [
  'initial',
  'restock',
  'adjustment',
  'sale',
  'return',
  'admin_correction',
];

@Entity('stock_movements')
@Index(['productId', 'createdAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'integer' })
  delta: number;

  @Column({ type: 'varchar', length: 32 })
  reason: StockMovementReason;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({
    name: 'actor_user_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  actorUserId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
