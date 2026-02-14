import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { MaterialReceiptStatus } from "src/entities/branch/material-receipts.entity";

export class CreateMaterialReceiptItemDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    article_id: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    unitCost: number;
}

export class CreateMaterialReceiptDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    store_id: number;

    @IsNumber()
    @IsOptional()
    purchaseOrder_id?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateMaterialReceiptItemDto)
    items: CreateMaterialReceiptItemDto[];
}
