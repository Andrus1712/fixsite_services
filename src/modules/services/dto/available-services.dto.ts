import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableServicesDto {
  @IsNumber()
  orderTypeId: number;

  @IsArray()
  @IsOptional()
  @Type(() => Number)
  orderServiceIds?: number[]; // IDs de orders_service, se resuelven a failure_code IDs internamente

  @IsNumber()
  @IsOptional()
  orderId?: number;
}
