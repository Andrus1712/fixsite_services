import { Exclude, Expose, Type, Transform } from "class-transformer";
import { IsOptional } from "class-validator";

export class CustomerResponseDto {
    @Expose()
    customer_id: number;

    @Expose()
    customer_name: string;

    @Expose()
    customer_email: string;

    @Expose()
    customer_phone: string;

    @Expose()
    customer_address: string;

    @Expose()
    customer_city: string;

    @Expose()
    customer_country: string;

    @Expose()
    customer_type: string;

    @Expose()
    preferred_contact: string;
}

export class DeviceTypeResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    description?: string;

    @Expose()
    isActive: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

export class DeviceBrandResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    description?: string;

    @Expose()
    isActive: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

export class DeviceModelResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    description?: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceType?.id)
    device_type: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceType?.name)
    device_type_name: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceBrand?.id)
    device_brand: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceBrand?.name)
    device_brand_name: string;
}

export class DeviceResponseDto {
    @Expose()
    id: number;

    @Expose()
    device_name: string;
    
    @Expose()
    @Transform(({ obj }) => obj.deviceModel?.id)
    device_model: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceModel?.name)
    device_model_name: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceModel?.deviceType?.id)
    device_type: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceModel?.deviceType?.name)
    device_type_name: string;
    
    @Expose()
    @Transform(({ obj }) => obj.deviceModel?.deviceBrand?.id)
    device_brand: string;

    @Expose()
    @Transform(({ obj }) => obj.deviceModel?.deviceBrand?.name)
    device_brand_name: string;

    @Expose()
    serial_number: string;

    @Expose()
    @IsOptional()
    imei?: string;

    @Expose()
    @IsOptional()
    model_year?: string;

    @Expose()
    @IsOptional()
    color?: string;

    @Expose()
    @IsOptional()
    storage_capacity?: string;
}

export class IssueResponseDto {
    @Expose()
    issue_id: number;

    @Expose()
    issue_name: string;

    @Expose()
    issue_description: string;

    @Expose()
    issue_type: number;

    @Expose()
    issue_type_description: string;

    @Expose()
    issue_severity: number;

    @Expose()
    issue_severity_description: string;

    @Expose()
    issue_reproducibility: number;

    @Expose()
    issue_reproducibility_description: string;

    @Expose()
    issue_frequency: number;

    @Expose()
    issue_frequency_description: string;

    @Expose()
    issue_impact: number;

    @Expose()
    issue_impact_description: string;

    @Expose()
    issue_difficulty: number;

    @Expose()
    issue_difficulty_description: string;

    @Expose()
    issue_priority: number;

    @Expose()
    issue_priority_description: string;

    @Expose()
    issue_urgency: number;

    @Expose()
    issue_urgency_description: string;

    @Expose()
    issue_detection: number;

    @Expose()
    issue_detection_description: string;

    @Expose()
    issue_reported_by: string;

    @Expose()
    issue_reported_date: string;

    @Expose()
    issue_reported_time: string;

    @Expose()
    issue_additional_info: string;

    @Expose()
    issue_screenshots: string[];

    @Expose()
    issue_videos: string[];

    @Expose()
    issue_logs: string[];

    @Expose()
    issue_attachments: string[];

    @Expose()
    issue_steps_to_reproduce: string[];

    @Expose()
    issue_environment: string;

    @Expose()
    issue_additional_notes: string;

    @Expose()
    issue_tags: string[];

    @Expose()
    issue_custom_fields: Record<string, any>;

    @Expose()
    issue_related_orders: string[];
}

export class TechnicianResponseDto {
    @Expose()
    assigned_technician_id: number;

    @Expose()
    assigned_technician_name: string;

    @Expose()
    assigned_technician_email: string;

    @Expose()
    assigned_technician_phone: string;

    @Expose()
    assigned_technician_specialty: string;

    @Expose()
    technician_level: string;

    @Expose()
    certification: string;
}

export class CostInfoDto {
    @Expose()
    estimated_cost: number;

    @Expose()
    actual_cost: number | null;

    @Expose()
    labor_cost: number;

    @Expose()
    parts_cost: number;

    @Expose()
    currency: string;

    @Expose()
    cost_approved: boolean;

    @Expose()
    quote_valid_until: string | null;
}

export class TimelineDto {
    @Expose()
    estimated_completion: string;

    @Expose()
    actual_completion: string | null;

    @Expose()
    estimated_hours: number;

    @Expose()
    actual_hours: number | null;

    @Expose()
    sla_deadline: string;
}

export class PartResponseDto {
    @Expose()
    part_id: string;

    @Expose()
    part_name: string;

    @Expose()
    quantity: number;

    @Expose()
    cost: number;

    @Expose()
    availability: string;
}

export class StatusHistoryDto {
    @Expose()
    status: string;

    @Expose()
    timestamp: string;

    @Expose()
    changed_by: string;

    @Expose()
    notes: string;
}

export class NoteResponseDto {
    @Expose()
    id: number;

    @Expose()
    author: string;

    @Expose()
    timestamp: string;

    @Expose()
    content: string;

    @Expose()
    type: string;
}

export class OrderResponseDto {
    @Expose()
    id: number;
    @Expose()
    order_code: string;
    @Expose()
    description: string;
    @Expose()
    status: number;
    @Expose()
    status_description: string;
    @Expose()
    priority: number;
    
    priority_description: string;
    @Expose()
    customer_id: number;
    @Expose()
    assigned_technician_id: number | null;

    @Expose()
    @IsOptional()
    @Type(() => NoteResponseDto)
    notes: NoteResponseDto[];

    @Expose()
    createdAt: string;

    @Expose()
    updatedAt: string;

    @Expose()
    @Type(() => DeviceResponseDto)
    @IsOptional()
    devices: DeviceResponseDto;

    // @IsOptional()
    // @Type(() => IssueResponseDto)
    // @Expose()
    // issue_info: IssueResponseDto;

    @IsOptional()
    @Type(() => CustomerResponseDto)
    @Expose()
    customer: CustomerResponseDto;

    // @IsOptional()
    // @Type(() => TechnicianResponseDto)
    // technician_data: TechnicianResponseDto;

    // @IsOptional()
    // @Type(() => CostInfoDto)
    // cost_info: CostInfoDto;

    // @IsOptional()
    // @Type(() => TimelineDto)
    // timeline: TimelineDto;

    // @IsOptional()
    // @Type(() => PartResponseDto)
    // parts_needed: PartResponseDto[];

    // @IsOptional()
    // @Type(() => StatusHistoryDto)
    // status_history: StatusHistoryDto[];
}