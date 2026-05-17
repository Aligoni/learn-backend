import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from './audit.service';
import { AuditLogDto } from './dto/audit-log.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';
import { PaginatedAuditLogsDto } from './dto/paginated-audit-logs.dto';

@ApiTags('admin-audit-logs')
@ApiBearerAuth('access-token')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'List admin audit log entries',
    description:
      'Newest first. Filter by entity type/id, actor, action, and creation date range.',
  })
  @ApiResponse({ status: 200, type: PaginatedAuditLogsDto })
  list(@Query() query: ListAuditLogsQueryDto): Promise<PaginatedAuditLogsDto> {
    return this.auditService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: AuditLogDto })
  @ApiResponse({ status: 404, description: 'No audit log with this id.' })
  getById(@Param('id', new ParseUUIDPipe()) id: string): Promise<AuditLogDto> {
    return this.auditService.getById(id);
  }
}
