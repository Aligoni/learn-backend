import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from './product.dto';
import { StockMovementDto } from './stock-movement.dto';

export class StockAdjustmentResultDto {
  @ApiProperty({
    type: ProductDto,
    description: 'Product after the adjustment.',
  })
  product: ProductDto;

  @ApiProperty({
    type: StockMovementDto,
    description: 'The movement that was recorded.',
  })
  movement: StockMovementDto;
}
