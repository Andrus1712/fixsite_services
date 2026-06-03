import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  base_price: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_articles?: boolean;
}
