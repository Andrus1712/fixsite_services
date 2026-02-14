import { Expose, Type } from "class-transformer";

export class StockTransferItemDto {
    @Expose()
    id: number;

    @Expose()
    article_id: number;

    @Expose()
    quantity: number;
}

export class StockTransferDto {
    @Expose()
    id: number;

    @Expose()
    fromStore_id: number;

    @Expose()
    toStore_id: number;

    @Expose()
    status: string;

    @Expose()
    createdBy: string;

    @Expose()
    approvedBy?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    @Type(() => StockTransferItemDto)
    items: StockTransferItemDto[];
}
