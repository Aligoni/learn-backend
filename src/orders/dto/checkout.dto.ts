import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutDto {
  @ApiPropertyOptional({
    description:
      'Optional note attached to the order (e.g. delivery instructions).',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
