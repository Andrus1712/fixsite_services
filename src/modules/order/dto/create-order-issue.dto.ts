import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateOrderIssueDto {
  @IsNumber()
  order_id: number;

  @IsString()
  title: string;

  @IsString()
  description: string;

  /** ID del código de falla del catálogo (FailureCode) */
  @IsNumber()
  @IsOptional()
  failure_code_id?: number;

  @IsString()
  @IsOptional()
  additional_notes?: string;

  @IsArray()
  @IsOptional()
  steps_to_reproduce?: string[];

  @IsString()
  @IsOptional()
  reported_by?: string;

  @IsOptional()
  attachments?: {
    filename: string;
    originalName: string;
    size: string;
    url: string;
  }[];
}
