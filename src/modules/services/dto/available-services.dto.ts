import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableServicesDto {
  @IsNumber()
  orderTypeId: number;

  @IsArray()
  @IsOptional()
  @Type(() => Number)
  issueIds?: number[];
}
