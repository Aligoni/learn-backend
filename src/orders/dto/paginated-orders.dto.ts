import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from './order.dto';

export class PaginatedOrdersDto {
  @ApiProperty({ type: [OrderDto] })
  items: OrderDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;
}
