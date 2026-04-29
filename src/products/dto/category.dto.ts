import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category id.',
  })
  id: string;

  @ApiProperty({ example: 'Electronics', description: 'Display name.' })
  name: string;

  @ApiProperty({ example: 'electronics', description: 'URL-safe slug.' })
  slug: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Gadgets, computers, and accessories.',
    description: 'Optional description.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-04-23T12:00:00.000Z',
    description: 'When the category was created.',
  })
  createdAt: Date;
}
