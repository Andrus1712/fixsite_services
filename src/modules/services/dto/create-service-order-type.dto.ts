import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateServiceOrderTypeDto {
  @IsNumber()
  serviceId: number;

  @IsNumber()
  orderTypeId: number;

  @IsNumber()
  @IsOptional()
  issueId?: number;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsNumber()
  @Min(0)
  tiempoEstimadoMinutos: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
