import { ApiProperty } from '@nestjs/swagger';

export class UserPublicDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Stable identifier for this user.',
  })
  id: string;

  @ApiProperty({
    format: 'email',
    example: 'student@example.com',
    description: 'Email address used at sign-up (unique).',
  })
  email: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-04-23T12:00:00.000Z',
    description: 'When this account was created.',
  })
  createdAt: Date;
}
