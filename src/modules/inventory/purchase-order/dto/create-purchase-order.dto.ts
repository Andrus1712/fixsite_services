import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive, ValidateNested } from "class-validator";
import { PurchaseOrderStatus } from "src/entities/branch/purchase-order.entity";

export class CreatePurchaseOrderDetailDto {
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

export class CreatePurchaseOrderDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    provider_id: number;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseOrderDetailDto)
    details: CreatePurchaseOrderDetailDto[];
}
