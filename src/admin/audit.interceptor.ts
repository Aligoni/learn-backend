import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import type { UserPublicDto } from '../users/dto/user-public.dto';
import { AuditFetcherRegistry } from './audit-fetcher.registry';
import { AuditService } from './audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly fetchers: AuditFetcherRegistry,
    private readonly auditService: AuditService,
  ) {}

  async intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const meta = this.reflector.get<AuditMetadata | undefined>(
      AUDIT_METADATA_KEY,
      ctx.getHandler(),
    );
    if (!meta) {
      return next.handle();
    }

    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: UserPublicDto; params?: Record<string, string> }>();
    const actor = request.user;
    if (!actor) {
      this.logger.warn(
        `Skipping audit for ${meta.action} ${meta.entityType}: no actor on request.`,
      );
      return next.handle();
    }

    let before: Record<string, unknown> | null = null;
    let entityIdForUpdateDelete: string | undefined;

    if (meta.action !== 'create') {
      const idParam = meta.idParam ?? 'id';
      entityIdForUpdateDelete = request.params?.[idParam];
      if (entityIdForUpdateDelete) {
        const fetcher = this.fetchers.get(meta.entityType);
        if (fetcher) {
          try {
            before = await fetcher(entityIdForUpdateDelete);
          } catch (err) {
            this.logger.warn(
              `Failed to capture "before" for ${meta.entityType} ${entityIdForUpdateDelete}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
        }
      }
    }

    return next.handle().pipe(
      tap((response: unknown) => {
        void this.recordSafe({
          meta,
          actorId: actor.id,
          before,
          entityIdForUpdateDelete,
          response,
        });
      }),
    );
  }

  private async recordSafe(args: {
    meta: AuditMetadata;
    actorId: string;
    before: Record<string, unknown> | null;
    entityIdForUpdateDelete: string | undefined;
    response: unknown;
  }): Promise<void> {
    const { meta, actorId, before, entityIdForUpdateDelete, response } = args;
    try {
      const afterPath = meta.afterFromResponse ?? [];
      const after =
        meta.action === 'delete'
          ? null
          : (this.pluck(response, afterPath) as Record<string, unknown> | null);

      let entityId: string | undefined;
      if (meta.action === 'create') {
        const idPath = meta.idFromResponse ?? ['id'];
        const idValue = this.pluck(response, idPath);
        if (typeof idValue === 'string') {
          entityId = idValue;
        }
      } else {
        entityId = entityIdForUpdateDelete;
      }
      if (!entityId) {
        this.logger.warn(
          `Skipping audit for ${meta.action} ${meta.entityType}: could not resolve entityId.`,
        );
        return;
      }

      await this.auditService.record({
        actorUserId: actorId,
        action: meta.action,
        entityType: meta.entityType,
        entityId,
        before,
        after,
      });
    } catch (err) {
      this.logger.error(
        `Audit write failed for ${meta.action} ${meta.entityType}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private pluck(source: unknown, path: string[]): unknown {
    if (path.length === 0) return source;
    let cur: unknown = source;
    for (const key of path) {
      if (cur && typeof cur === 'object' && key in (cur as object)) {
        cur = (cur as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return cur;
  }
}
