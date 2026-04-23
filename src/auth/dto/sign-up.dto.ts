import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    format: 'email',
    example: 'student@example.com',
    description:
      'Must be unique; stored normalized (trimmed and lower-cased). Used as your username.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 128,
    example: 'Str0ngP@ssw0rd',
    description:
      'Plain text on the wire; the server never stores it, only a password hash.',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128)
  password: string;
}
