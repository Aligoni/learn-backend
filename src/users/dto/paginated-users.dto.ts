import { ApiProperty } from '@nestjs/swagger';
import { UserPublicDto } from './user-public.dto';

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserPublicDto], description: 'Page of users.' })
  items: UserPublicDto[];

  @ApiProperty({ example: 42, description: 'Total matching users.' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page (1-based).' })
  page: number;

  @ApiProperty({ example: 20, description: 'Page size.' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total number of pages.' })
  totalPages: number;

  @ApiProperty({
    example: true,
    description: 'Whether another page exists after this one.',
  })
  hasNextPage: boolean;
}
