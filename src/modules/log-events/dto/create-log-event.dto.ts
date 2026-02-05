import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsObject, IsTimeZone, IsDate } from 'class-validator';
import { LogStatus, LogType } from 'src/entities/branch/log-events.entity';

export class CreateLogEventDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Date)
    @IsDate()
    timestamp: Date;

    @IsEnum(LogType)
    type: LogType;

    @IsOptional()
    @IsEnum(LogStatus)
    status?: LogStatus;

    @IsOptional()
    @IsString()
    user?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @IsOptional()
    @IsString()
    icon?: string;
}