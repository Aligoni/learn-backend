import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 80,
    example: 'Grace Hopper',
    description: 'Display name for the new admin.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiProperty({
    format: 'email',
    example: 'grace@example.com',
    description: 'Unique email for the new admin (trimmed and lower-cased).',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 128,
    example: 'Str0ngP@ssw0rd',
    description: 'Initial password for the new admin.',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128)
  password: string;
}
