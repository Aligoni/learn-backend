import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_SHIPPING_FEE_CENTS,
  SETTING_KEYS,
  Setting,
} from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  async getShippingFeeCents(): Promise<number> {
    const row = await this.settingsRepo.findOne({
      where: { key: SETTING_KEYS.shippingFeeCents },
    });
    if (!row) return DEFAULT_SHIPPING_FEE_CENTS;
    const v = row.value;
    return typeof v === 'number' && Number.isInteger(v) && v >= 0
      ? v
      : DEFAULT_SHIPPING_FEE_CENTS;
  }

  async setShippingFeeCents(value: number): Promise<number> {
    await this.settingsRepo.save({
      key: SETTING_KEYS.shippingFeeCents,
      value,
    });
    return value;
  }
}
