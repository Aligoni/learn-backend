import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../../products/entities/numeric-transformer';
import { Product } from '../../products/entities/product.entity';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  unitPrice: number;

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  lineTotal: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ name: 'product_name', type: 'varchar', length: 120 })
  productName: string;

  @Column({ name: 'product_slug', type: 'varchar', length: 140 })
  productSlug: string;

  @Column({ name: 'product_image_url', type: 'varchar', length: 500 })
  productImageUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
