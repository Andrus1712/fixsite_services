import { Expose, Type } from "class-transformer";

export class InventoryAdjustmentItemDto {
    @Expose()
    id: number;

    @Expose()
    article_id: number;

    @Expose()
    currentQuantity: number;

    @Expose()
    newQuantity: number;

    @Expose()
    difference: number;
}

export class InventoryAdjustmentDto {
    @Expose()
    id: number;

    @Expose()
    store_id: number;

    @Expose()
    reason: string;

    @Expose()
    status: string;

    @Expose()
    createdBy: string;

    @Expose()
    approvedBy?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    @Type(() => InventoryAdjustmentItemDto)
    items: InventoryAdjustmentItemDto[];
}
