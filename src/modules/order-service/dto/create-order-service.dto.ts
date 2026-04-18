import { IsInt, IsOptional, IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateOrderServiceDto {
  @IsInt()
  order_id: number;

  @IsInt()
  service_id: number;

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
