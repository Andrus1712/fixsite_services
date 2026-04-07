import { Expose, Type } from "class-transformer";

export class PurchaseOrderDetailDto {
    @Expose()
    id: number;

    @Expose()
    article_id: number;

    @Expose()
    quantity: number;

    @Expose()
    unitCost: number;
}

export class PurchaseOrderDto {
    @Expose()
    id: number;

    @Expose()
    provider_id: number;

    @Expose()
    status: string;

    @Expose()
    date: Date;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;

    @Expose()
    @Type(() => PurchaseOrderDetailDto)
    purchase_order_details: PurchaseOrderDetailDto[];
}
