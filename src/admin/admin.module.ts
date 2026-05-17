import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import { AuditFetcherRegistry } from './audit-fetcher.registry';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AdminAuditLogsController],
  providers: [
    AuditService,
    AuditFetcherRegistry,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService, AuditFetcherRegistry],
})
export class AdminModule {}
