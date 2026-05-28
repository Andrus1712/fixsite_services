import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsNotEmpty } from 'class-validator';
import { LogStatus, LogType } from 'src/entities/branch/log-events.entity';

export class CreateLogEventDto {
    @IsNumber()
    @IsNotEmpty()
    order_id: number;

    @IsEnum(LogType)
    type: LogType;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @IsOptional()
    @IsEnum(LogStatus)
    status?: LogStatus;
}
