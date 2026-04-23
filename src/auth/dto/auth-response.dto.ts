import { ApiProperty } from '@nestjs/swagger';
import { UserPublicDto } from '../../users/dto/user-public.dto';

export class AuthResponseDto {
  @ApiProperty({
    description:
      'JWT access token. Send as `Authorization: Bearer <accessToken>` for protected routes.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIuLi4ifQ.signature',
  })
  accessToken: string;

  @ApiProperty({
    type: UserPublicDto,
    description:
      'Public profile for the authenticated user (no password fields).',
  })
  user: UserPublicDto;
}
