import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 80,
    example: 'Outdoor Gear',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    example: 'outdoor-gear',
    description:
      'Lowercase letters, digits, and single dashes only. Pass to rename the slug.',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Tents, backpacks, and trail accessories.',
    description: 'Pass empty string to clear.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
