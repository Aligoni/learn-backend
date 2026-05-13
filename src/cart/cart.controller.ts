import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { UserPublicDto } from '../users/dto/user-public.dto';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartDto } from './dto/cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_SESSION_HEADER = 'x-cart-session';

@ApiTags('cart')
@ApiBearerAuth('access-token')
@ApiSecurity('cart-session')
@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the active cart',
    description:
      'Returns the cart for the authenticated user (Bearer token) or for the guest session ' +
      '(`X-Cart-Session` header). If neither is provided, or no cart has been created yet, returns ' +
      'an empty transient cart that is not persisted.',
  })
  @ApiResponse({ status: 200, description: 'Active cart.', type: CartDto })
  async getCart(
    @CurrentUser() user: UserPublicDto | undefined,
    @Headers(CART_SESSION_HEADER) sessionId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CartDto> {
    const cart = await this.cartService.getActiveCart(user, sessionId);
    this.maybeSetSessionHeader(res, cart);
    return cart;
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add an item to the cart',
    description:
      'Adds the requested quantity of a product. If the product is already in the cart, the ' +
      'quantities are summed. The request is rejected with 400 if the resulting quantity exceeds ' +
      'the product stock. For guests with no prior session, a new guest session is created and ' +
      'returned via the `X-Cart-Session` response header and the `sessionId` field of the response body.',
  })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({
    status: 201,
    description: 'Updated cart with the new item merged in.',
    type: CartDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Quantity exceeds available stock or fails validation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Product id does not exist.',
  })
  async addItem(
    @CurrentUser() user: UserPublicDto | undefined,
    @Headers(CART_SESSION_HEADER) sessionId: string | undefined,
    @Body() dto: AddCartItemDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CartDto> {
    const cart = await this.cartService.addItem(user, sessionId, dto);
    this.maybeSetSessionHeader(res, cart);
    return cart;
  }

  @Patch('items/:itemId')
  @ApiOperation({
    summary: 'Set the quantity of a cart item',
    description:
      'Replaces the quantity of a single line. Quantity is an absolute value (not a delta) and must ' +
      'be at least 1. Rejected with 400 if it exceeds the product stock. Use DELETE to remove a line.',
  })
  @ApiParam({ name: 'itemId', format: 'uuid', description: 'Cart line id.' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: 200,
    description: 'Updated cart after the quantity change.',
    type: CartDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Quantity exceeds available stock or fails validation.',
  })
  @ApiResponse({
    status: 404,
    description: 'No active cart, or item does not belong to this cart.',
  })
  async updateItem(
    @CurrentUser() user: UserPublicDto | undefined,
    @Headers(CART_SESSION_HEADER) sessionId: string | undefined,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CartDto> {
    const cart = await this.cartService.updateItem(
      user,
      sessionId,
      itemId,
      dto,
    );
    this.maybeSetSessionHeader(res, cart);
    return cart;
  }

  @Delete('items/:itemId')
  @ApiOperation({
    summary: 'Remove an item from the cart',
    description:
      'Deletes a single cart line. Returns the updated cart (which may be empty).',
  })
  @ApiParam({ name: 'itemId', format: 'uuid', description: 'Cart line id.' })
  @ApiResponse({
    status: 200,
    description: 'Updated cart after the item was removed.',
    type: CartDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No active cart, or item does not belong to this cart.',
  })
  async removeItem(
    @CurrentUser() user: UserPublicDto | undefined,
    @Headers(CART_SESSION_HEADER) sessionId: string | undefined,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CartDto> {
    const cart = await this.cartService.removeItem(user, sessionId, itemId);
    this.maybeSetSessionHeader(res, cart);
    return cart;
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Empty the cart',
    description:
      'Removes all items from the active cart. The cart itself is retained so the same id/session continues to work.',
  })
  @ApiResponse({
    status: 200,
    description: 'Emptied cart.',
    type: CartDto,
  })
  async clear(
    @CurrentUser() user: UserPublicDto | undefined,
    @Headers(CART_SESSION_HEADER) sessionId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CartDto> {
    const cart = await this.cartService.clear(user, sessionId);
    this.maybeSetSessionHeader(res, cart);
    return cart;
  }

  private maybeSetSessionHeader(res: Response, cart: CartDto): void {
    if (cart.sessionId) {
      res.setHeader('X-Cart-Session', cart.sessionId);
    }
  }
}
