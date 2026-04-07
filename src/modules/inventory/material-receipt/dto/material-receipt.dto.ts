import { Expose, Type } from "class-transformer";

export class MaterialReceiptItemDto {
    @Expose()
    id: number;

    @Expose()
    article_id: number;

    @Expose()
    quantity: number;

    @Expose()
    unitCost: number;
}

export class MaterialReceiptDto {
    @Expose()
    id: number;

    @Expose()
    store_id: number;

    @Expose()
    purchaseOrder_id?: number;

    @Expose()
    status: string;

    @Expose()
    createdBy: string;

    @Expose()
    approvedBy?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    @Type(() => MaterialReceiptItemDto)
    items: MaterialReceiptItemDto[];
}
