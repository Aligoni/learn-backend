import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserPublicDto } from '../users/dto/user-public.dto';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPublicDto => {
    const request = ctx.switchToHttp().getRequest<{ user: UserPublicDto }>();
    return request.user;
  },
);
