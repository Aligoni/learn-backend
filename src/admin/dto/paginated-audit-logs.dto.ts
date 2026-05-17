import { ApiProperty } from '@nestjs/swagger';
import { AuditLogDto } from './audit-log.dto';

export class PaginatedAuditLogsDto {
  @ApiProperty({ type: [AuditLogDto] })
  items: AuditLogDto[];

  @ApiProperty({ example: 173 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 9 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;
}
