import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderIssueDto {
  @IsNumber()
  order_id: number;

  @IsString()
  issue_name: string;

  @IsString()
  issue_description: string;

  @IsNumber()
  issue_type: number;

  @IsNumber()
  issue_severity: number;

  @IsNumber()
  issue_code: number;

  @IsOptional()
  @IsString()
  issue_additional_info?: string;

  @IsOptional()
  @IsArray()
  issue_steps_to_reproduce?: string[];

  @IsOptional()
  @IsString()
  issue_environment?: string;

  @IsOptional()
  @IsString()
  issue_additional_notes?: string;

  @IsOptional()
  @IsArray()
  issue_files?: {
    filename: string;
    originalName: string;
    size: string;
    url: string;
  }[];
}
