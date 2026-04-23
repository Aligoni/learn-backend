import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LogInDto {
  @ApiProperty({
    format: 'email',
    example: 'student@example.com',
    description: 'Email for the account you are signing in to.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 1,
    example: 'Str0ngP@ssw0rd',
    description: 'Password for this account.',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
