import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { Audit } from '../admin/audit.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserPublicDto } from '../users/dto/user-public.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { OrderDto } from './dto/order.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('admin-orders')
@ApiBearerAuth('access-token')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List all orders (paginated)',
    description: 'Filter by status, userId, and date range.',
  })
  @ApiResponse({ status: 200, type: PaginatedOrdersDto })
  list(@Query() query: ListOrdersQueryDto): Promise<PaginatedOrdersDto> {
    return this.ordersService.listForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get any order by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: OrderDto })
  @ApiResponse({ status: 404, description: 'No order with this id.' })
  getById(@Param('id', new ParseUUIDPipe()) id: string): Promise<OrderDto> {
    return this.ordersService.getByIdForAdmin(id);
  }

  @Patch(':id/status')
  @Audit({ entityType: 'order', action: 'update' })
  @ApiOperation({
    summary: 'Change an order status',
    description:
      'Allowed transitions: pending→paid|cancelled, paid→shipped|cancelled|refunded, ' +
      'shipped→delivered|refunded, delivered→refunded. Cancelled and refunded are terminal. ' +
      'Transitions to `cancelled` or `refunded` release stock back via StockService (one ' +
      '`return` movement per line).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: OrderDto })
  @ApiResponse({ status: 404, description: 'No order with this id.' })
  @ApiResponse({ status: 409, description: 'Invalid state transition.' })
  changeStatus(
    @CurrentUser() user: UserPublicDto,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeOrderStatusDto,
  ): Promise<OrderDto> {
    return this.ordersService.changeStatusAsAdmin(id, dto.status, user.id);
  }
}
