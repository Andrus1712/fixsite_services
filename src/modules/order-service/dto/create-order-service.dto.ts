import {
  IsInt,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderServicePartDto {
  @IsInt()
  @Min(1)
  article_id: number;

  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;
}

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderServicePartDto)
  parts?: OrderServicePartDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  store_id?: number;
}
