import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableServicesDto {
  @IsNumber()
  orderTypeId: number;

  /** IDs de OrderIssue (fallas reportadas) pendientes de resolver */
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  orderIssueIds?: number[];

  @IsNumber()
  @IsOptional()
  orderId?: number;
}
