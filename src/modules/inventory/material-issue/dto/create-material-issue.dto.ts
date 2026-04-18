import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";

export class CreateMaterialIssueItemDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    article_id!: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    quantity!: number;

    @IsString()
    @IsOptional()
    destinationReference?: string;
}

export class CreateMaterialIssueDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    store_id!: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateMaterialIssueItemDto)
    items!: CreateMaterialIssueItemDto[];

    @IsString()
    @IsOptional()
    destinationReference?: string;
}
