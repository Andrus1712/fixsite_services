import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class CustomerResponseDto {
    customer_id: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_city: string;
    customer_country: string;
    customer_type: string;
    preferred_contact: string;
}

export class DeviceResponseDto {
    device_id: number;
    device_name: string;
    device_type: number;
    device_type_description: string;
    device_brand: number;
    device_brand_type: string;
    serial_number: string;
    imei: string;
    model_year: string;
    color: string;
    storage_capacity: string;
}

export class IssueResponseDto {
    issue_id: number;
    issue_name: string;
    issue_description: string;
    issue_type: number;
    issue_type_description: string;
    issue_severity: number;
    issue_severity_description: string;
    issue_reproducibility: number;
    issue_reproducibility_description: string;
    issue_frequency: number;
    issue_frequency_description: string;
    issue_impact: number;
    issue_impact_description: string;
    issue_difficulty: number;
    issue_difficulty_description: string;
    issue_priority: number;
    issue_priority_description: string;
    issue_urgency: number;
    issue_urgency_description: string;
    issue_detection: number;
    issue_detection_description: string;
    issue_reported_by: string;
    issue_reported_date: string;
    issue_reported_time: string;
    issue_additional_info: string;
    issue_screenshots: string[];
    issue_videos: string[];
    issue_logs: string[];
    issue_attachments: string[];
    issue_steps_to_reproduce: string[];
    issue_environment: string;
    issue_additional_notes: string;
    issue_tags: string[];
    issue_custom_fields: Record<string, any>;
    issue_related_orders: string[];
}

export class TechnicianResponseDto {
    assigned_technician_id: number;
    assigned_technician_name: string;
    assigned_technician_email: string;
    assigned_technician_phone: string;
    assigned_technician_specialty: string;
    technician_level: string;
    certification: string;
}

export class CostInfoDto {
    estimated_cost: number;
    actual_cost: number | null;
    labor_cost: number;
    parts_cost: number;
    currency: string;
    cost_approved: boolean;
    quote_valid_until: string | null;
}

export class TimelineDto {
    estimated_completion: string;
    actual_completion: string | null;
    estimated_hours: number;
    actual_hours: number | null;
    sla_deadline: string;
}

export class PartResponseDto {
    part_id: string;
    part_name: string;
    quantity: number;
    cost: number;
    availability: string;
}

export class StatusHistoryDto {
    status: string;
    timestamp: string;
    changed_by: string;
    notes: string;
}

export class NoteResponseDto {
    id: number;
    author: string;
    timestamp: string;
    content: string;
    type: string;
}

export class OrderResponseDto {
    id: number;
    order_code: string;
    description: string;

    @Type(() => DeviceResponseDto)
    @IsOptional()
    device_data: DeviceResponseDto;

    @IsOptional()
    @Type(() => IssueResponseDto)
    issue_info: IssueResponseDto;

    status: number;
    status_description: string;
    priority: number;
    priority_description: string;
    customer_id: number;

    @IsOptional()
    @Type(() => CustomerResponseDto)
    customer_data: CustomerResponseDto;

    assigned_technician_id: number | null;

    @IsOptional()
    @Type(() => TechnicianResponseDto)
    technician_data: TechnicianResponseDto;

    @IsOptional()
    @Type(() => CostInfoDto)
    cost_info: CostInfoDto;

    @IsOptional()
    @Type(() => TimelineDto)
    timeline: TimelineDto;

    @IsOptional()
    @Type(() => PartResponseDto)
    parts_needed: PartResponseDto[];

    @IsOptional()
    @Type(() => StatusHistoryDto)
    status_history: StatusHistoryDto[];

    @IsOptional()
    @Type(() => NoteResponseDto)
    notes: NoteResponseDto[];

    createdAt: string;
    updatedAt: string;
}