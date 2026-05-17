import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../../products/entities/numeric-transformer';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  subtotal: number;

  @Column({
    name: 'shipping_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  shippingFee: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: ['insert'],
  })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
