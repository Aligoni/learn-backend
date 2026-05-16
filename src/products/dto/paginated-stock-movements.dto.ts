import { ApiProperty } from '@nestjs/swagger';
import { StockMovementDto } from './stock-movement.dto';

export class PaginatedStockMovementsDto {
  @ApiProperty({ type: [StockMovementDto] })
  items: StockMovementDto[];

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
