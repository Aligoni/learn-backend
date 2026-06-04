import { UnauthorizedException } from '@nestjs/common';
import type { UserPublicDto } from '../users/dto/user-public.dto';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard.handleRequest', () => {
  const guard = new OptionalJwtAuthGuard();
  const user = { id: 'u1' } as UserPublicDto;

  it('returns the user when authentication succeeds', () => {
    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('returns undefined for an anonymous request (no/invalid token)', () => {
    // passport-jwt: absent/expired/malformed token -> user === false, err null.
    expect(guard.handleRequest(null, false)).toBeUndefined();
  });

  it('re-throws errors from validate() (e.g. deleted user with a valid token)', () => {
    const err = new UnauthorizedException('User no longer exists.');
    expect(() => guard.handleRequest(err, false)).toThrow(err);
  });
});
