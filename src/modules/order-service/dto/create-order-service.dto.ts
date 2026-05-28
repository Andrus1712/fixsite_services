import { IsInt, IsOptional, IsBoolean, IsNumber, IsString, IsArray } from 'class-validator';

export class CreateOrderServiceDto {
  @IsInt()
  order_id: number;

  @IsInt()
  service_id: number;

  /** IDs de OrderIssue (fallas reportadas) que este servicio resuelve */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  issue_ids?: number[];

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  estimated_minutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
