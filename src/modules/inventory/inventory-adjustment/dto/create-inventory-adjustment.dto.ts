import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";

export class CreateInventoryAdjustmentItemDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    article_id: number;

    @IsNumber()
    @IsNotEmpty()
    currentQuantity: number;

    @IsNumber()
    @IsNotEmpty()
    newQuantity: number;
}

export class CreateInventoryAdjustmentDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    store_id: number;

    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInventoryAdjustmentItemDto)
    items: CreateInventoryAdjustmentItemDto[];
}
