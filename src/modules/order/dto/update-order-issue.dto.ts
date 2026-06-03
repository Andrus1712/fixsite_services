import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
    @IsString()
    filename: string;

    @IsString()
    originalName: string;

    @IsString()
    size: string;

    @IsString()
    url: string;
}

export class UpdateOrderIssueDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    failure_code_id?: number;

    @IsString()
    @IsOptional()
    additional_notes?: string;

    @IsArray()
    @IsOptional()
    steps_to_reproduce?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttachmentDto)
    @IsOptional()
    attachments?: AttachmentDto[];
}
