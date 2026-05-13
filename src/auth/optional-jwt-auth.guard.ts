import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { UserPublicDto } from '../users/dto/user-public.dto';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserPublicDto>(
    _err: unknown,
    user: TUser | false,
  ): TUser {
    return (user || undefined) as TUser;
  }
}
