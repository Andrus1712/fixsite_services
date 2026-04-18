import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateOrderTypeDto {
  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
