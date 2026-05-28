import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateServiceOrderTypeDto {
  @IsNumber()
  service_id: number;

  @IsNumber()
  order_type_id: number;

  /** ID del FailureCode al que aplica este precio (opcional) */
  @IsNumber()
  @IsOptional()
  failure_code_id?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  estimated_minutes: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
