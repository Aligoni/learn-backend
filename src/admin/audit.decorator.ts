import { SetMetadata } from '@nestjs/common';
import type { AuditAction, AuditEntityType } from './entities/audit-log.entity';

export const AUDIT_METADATA_KEY = 'audit:metadata';

export interface AuditMetadata {
  entityType: AuditEntityType;
  action: AuditAction;
  /**
   * Route param to read for update/delete (defaults to 'id').
   * Ignored for 'create' — the entityId comes from the response.
   */
  idParam?: string;
  /**
   * For 'create' actions: where in the response body to find the entityId.
   * Defaults to ['id']. Use e.g. ['movement', 'id'] when the response is wrapped.
   */
  idFromResponse?: string[];
  /**
   * For 'create' actions: where in the response body to find the 'after' snapshot.
   * Defaults to the whole response. Use e.g. ['movement'] for wrapped responses.
   */
  afterFromResponse?: string[];
}

export const Audit = (meta: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA_KEY, meta);
