import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  codigo: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  @Min(0)
  precio_base: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
