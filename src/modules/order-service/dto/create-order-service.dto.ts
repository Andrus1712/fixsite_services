import { IsInt, IsOptional, IsBoolean, IsNumber, IsString, IsArray } from 'class-validator';

export class CreateOrderServiceDto {
  @IsInt()
  order_id: number;

  @IsInt()
  service_id: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  issues_ids?: number[];

  @IsOptional()
  @IsNumber()
  precio?: number;

  @IsOptional()
  @IsInt()
  tiempo_estimado_minutos?: number;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
