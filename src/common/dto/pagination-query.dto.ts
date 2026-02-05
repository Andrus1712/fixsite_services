import { IsInt, IsOptional, IsPositive, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)       // convierte el valor de query string a number
    @IsInt()
    @IsPositive()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    limit?: number = 10;

    @IsOptional()
    @IsString()
    filter?: string;
}