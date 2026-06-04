import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { UserPublicDto } from '../users/dto/user-public.dto';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserPublicDto>(
    err: unknown,
    user: TUser | false,
  ): TUser {
    // An absent/malformed/expired token arrives as `user === false` with `err`
    // null (the failure is in `info`) — for optional auth we treat that as an
    // anonymous request. But an error thrown from JwtStrategy.validate() (e.g.
    // the token is valid but the user has since been deleted) arrives as `err`
    // and must surface as a 401 rather than being silently downgraded.
    if (err) {
      throw err instanceof Error ? err : new UnauthorizedException();
    }
    return (user || undefined) as TUser;
  }
}
