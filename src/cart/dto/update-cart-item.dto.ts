import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    example: 3,
    minimum: 1,
    type: 'integer',
    description:
      'New absolute quantity for this line. Use DELETE /cart/items/:itemId to remove an item; quantity 0 is rejected.',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
