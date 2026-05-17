import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPublicDto } from '../users/dto/user-public.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { OrderDto } from './dto/order.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({
    summary: 'Check out the active cart',
    description:
      'Snapshots cart lines into an Order with `status: pending`, decrements stock through ' +
      'StockService (one movement per line), and clears the cart. Requires `Idempotency-Key` ' +
      'header — repeating the same key + same user returns the existing order rather than ' +
      'creating a duplicate.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Client-generated unique key to make this checkout safe to retry.',
  })
  @ApiBody({ type: CheckoutDto, required: false })
  @ApiResponse({ status: 201, type: OrderDto })
  @ApiResponse({
    status: 400,
    description:
      'Empty cart, mixed currencies, deleted product, or insufficient stock.',
  })
  @ApiResponse({
    status: 409,
    description: 'Concurrent checkout with the same Idempotency-Key.',
  })
  async checkout(
    @CurrentUser() user: UserPublicDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: CheckoutDto,
  ): Promise<OrderDto> {
    return this.ordersService.checkout(user.id, idempotencyKey, dto);
  }

  @Get('orders/mine')
  @ApiOperation({ summary: 'List my orders (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedOrdersDto })
  async listMine(
    @CurrentUser() user: UserPublicDto,
    @Query() query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    return this.ordersService.findMine(user.id, query);
  }

  @Get('orders/mine/:id')
  @ApiOperation({ summary: 'Get one of my orders by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: OrderDto })
  @ApiResponse({
    status: 404,
    description: 'Order does not exist or belongs to another user.',
  })
  async getMine(
    @CurrentUser() user: UserPublicDto,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OrderDto> {
    return this.ordersService.findMineById(user.id, id);
  }

  @Post('orders/:id/pay')
  @ApiOperation({
    summary: 'Mark a pending order as paid (training stub)',
    description:
      'Flips the order status from `pending` to `paid`. No real payment provider — this is a ' +
      'stub for the FE flow. The order must belong to the caller and currently be `pending`.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, type: OrderDto })
  @ApiResponse({
    status: 404,
    description: 'Order does not exist or is not yours.',
  })
  @ApiResponse({
    status: 409,
    description: 'Order is not in `pending` status.',
  })
  async pay(
    @CurrentUser() user: UserPublicDto,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OrderDto> {
    return this.ordersService.payAsUser(user.id, id);
  }
}
