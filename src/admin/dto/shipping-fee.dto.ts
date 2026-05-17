import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ShippingFeeDto {
  @ApiProperty({
    type: Number,
    example: 599,
    description:
      'Shipping fee in the smallest currency unit (cents). 599 = $5.99. ' +
      'Integer to avoid floating-point money bugs.',
    minimum: 0,
  })
  feeCents: number;
}

export class SetShippingFeeDto {
  @ApiProperty({
    type: Number,
    example: 599,
    description:
      'New shipping fee in cents. Use 0 for free shipping. Applies to all future checkouts.',
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  feeCents: number;
}
