import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AuditFetcherRegistry } from './audit-fetcher.registry';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { Setting } from './entities/setting.entity';
import { SettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Setting])],
  controllers: [AdminAuditLogsController, AdminSettingsController],
  providers: [
    AuditService,
    SettingsService,
    AuditFetcherRegistry,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService, SettingsService, AuditFetcherRegistry],
})
export class AdminModule {}
