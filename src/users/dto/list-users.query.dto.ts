import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { UserRole } from '../entities/user.entity';

export enum UserRoleFilter {
  user = 'user',
  admin = 'admin',
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Page number (1-based).',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    description: 'Items per page.',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    description: 'Case-insensitive substring match on name or email.',
    example: 'grace',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: UserRoleFilter,
    description: 'Optional filter by role.',
    example: UserRoleFilter.admin,
  })
  @IsOptional()
  @IsEnum(UserRoleFilter)
  role?: UserRole;
}
