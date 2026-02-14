import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsPositive, ValidateNested } from "class-validator";

export class CreateStockTransferItemDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    article_id: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    stock: number;
}

export class CreateStockTransferDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    fromStore_id: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    toStore_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStockTransferItemDto)
    items: CreateStockTransferItemDto[];
}
