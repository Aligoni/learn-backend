import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'simple-json' })
  value: unknown;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

export const SETTING_KEYS = {
  shippingFeeCents: 'shipping_fee_cents',
} as const;

export const DEFAULT_SHIPPING_FEE_CENTS = 0;
