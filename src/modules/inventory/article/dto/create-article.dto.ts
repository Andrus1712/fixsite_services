import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreateArticleDto {
    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    sku: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    category_id: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    brand_id: number;

    @IsString()
    @IsNotEmpty()
    unit_measurement: string;

    @IsBoolean()
    active: boolean;
}
