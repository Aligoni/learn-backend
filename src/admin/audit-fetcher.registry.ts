import { Injectable, Logger } from '@nestjs/common';
import type { AuditEntityType } from './entities/audit-log.entity';

export type AuditFetcher = (
  id: string,
) => Promise<Record<string, unknown> | null>;

@Injectable()
export class AuditFetcherRegistry {
  private readonly logger = new Logger(AuditFetcherRegistry.name);
  private readonly fetchers = new Map<AuditEntityType, AuditFetcher>();

  register(entityType: AuditEntityType, fetcher: AuditFetcher): void {
    if (this.fetchers.has(entityType)) {
      this.logger.warn(
        `Overwriting existing audit fetcher for "${entityType}".`,
      );
    }
    this.fetchers.set(entityType, fetcher);
  }

  get(entityType: AuditEntityType): AuditFetcher | undefined {
    return this.fetchers.get(entityType);
  }
}
