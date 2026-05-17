import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserPublicDto } from '../users/dto/user-public.dto';
import { AuditService } from './audit.service';
import { SetShippingFeeDto, ShippingFeeDto } from './dto/shipping-fee.dto';
import { SETTING_KEYS } from './entities/setting.entity';
import { SettingsService } from './settings.service';

@ApiTags('admin-settings')
@ApiBearerAuth('access-token')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('shipping')
  @ApiOperation({
    summary: 'Get the current shipping fee',
    description: 'Returns the global flat shipping fee, in cents.',
  })
  @ApiResponse({ status: 200, type: ShippingFeeDto })
  async getShipping(): Promise<ShippingFeeDto> {
    return { feeCents: await this.settingsService.getShippingFeeCents() };
  }

  @Put('shipping')
  @ApiOperation({
    summary: 'Set the global shipping fee',
    description: 'Updates the flat shipping fee applied to new orders.',
  })
  @ApiResponse({ status: 200, type: ShippingFeeDto })
  async setShipping(
    @CurrentUser() user: UserPublicDto,
    @Body() dto: SetShippingFeeDto,
  ): Promise<ShippingFeeDto> {
    const before = await this.settingsService.getShippingFeeCents();
    const feeCents = await this.settingsService.setShippingFeeCents(
      dto.feeCents,
    );
    await this.auditService.record({
      actorUserId: user.id,
      action: 'update',
      entityType: 'setting',
      entityId: SETTING_KEYS.shippingFeeCents,
      before: { feeCents: before },
      after: { feeCents },
    });
    return { feeCents };
  }
}
