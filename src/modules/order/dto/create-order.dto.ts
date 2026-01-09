import { IsString, IsNumber, IsArray, IsObject, ValidateNested, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class DeviceDataDto {
  @IsString()
  device_name: string;

  @IsNumber()
  device_type: number;

  @IsNumber()
  device_brand: number;

  device_model: string;

  @IsOptional()
  @IsString()
  serial_number?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsString()
  model_year: string;

  @IsString()
  color: string;

  @IsString()
  storage_capacity: string;
}

export class IssueDto {
  @IsString()
  issue_name: string;

  @IsString()
  issue_description: string;

  @IsNumber()
  issue_type: number;

  @IsNumber()
  issue_severity: number;

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
  issue_screenshots?: any[];
}

export class CustomerDataDto {
  @IsString()
  customer_name: string;

  @IsString()
  customer_email: string;

  @IsString()
  customer_phone: string;

  @IsString()
  customer_address: string;

  @IsString()
  customer_city: string;

  @IsString()
  customer_country: string;

  @IsString()
  customer_type: string;

  @IsString()
  preferred_contact: string;
}

export class CostInfoDto {
  @IsNumber()
  estimated_cost: number;

  @IsNumber()
  labor_cost: number;

  @IsNumber()
  parts_cost: number;

  @IsString()
  currency: string;
}

export class TimelineDto {
  @IsDateString()
  estimated_completion: string;

  @IsNumber()
  estimated_hours: number;

  @IsDateString()
  sla_deadline: string;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  order_code: string;

  @IsString()
  description: string;

  serviceType:string;

  @ValidateNested()
  @Type(() => DeviceDataDto)
  device_data: DeviceDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueDto)
  issues: IssueDto[];

  @ValidateNested()
  @Type(() => CustomerDataDto)
  customer_data: CustomerDataDto;

  @ValidateNested()
  @Type(() => CostInfoDto)
  cost_info: CostInfoDto;

  @ValidateNested()
  @Type(() => TimelineDto)
  timeline: TimelineDto;

  @IsNumber()
  priority: number;
}