import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 80,
    example: 'Outdoor Gear',
    description: 'Display name (trimmed).',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({
    example: 'outdoor-gear',
    description:
      'Optional URL slug. Lowercase letters, digits, and single dashes only. ' +
      'If omitted, derived from the name.',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Tents, backpacks, and trail accessories.',
    description: 'Optional human-readable description.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
