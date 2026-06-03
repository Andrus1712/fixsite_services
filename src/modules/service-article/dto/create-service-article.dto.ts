import { IsInt, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateServiceArticleDto {
    @IsInt()
    service_id: number;

    @IsInt()
    article_id: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(9999.99)
    default_quantity: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
