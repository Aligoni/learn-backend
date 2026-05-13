import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true, where: '"user_id" IS NOT NULL' })
  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Index({ unique: true, where: '"session_id" IS NOT NULL' })
  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId: string | null;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: ['insert', 'update'],
  })
  items: CartItem[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
