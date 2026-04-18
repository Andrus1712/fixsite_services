import { Expose, Type } from "class-transformer";

export class MaterialIssueItemDto {
    @Expose()
    id: number;

    @Expose()
    article_id: number;

    @Expose()
    quantity: number;

    @Expose()
    destinationReference?: string;

    @Expose()
    article_name: string;

    @Expose()
    article_sku: string;

    @Expose()
    article_unit_measurement: string;

    @Expose()
    article_category_name: string;

    @Expose()
    article_brand_name: string;

    @Expose()
    order_code?: string;
}

export class MaterialIssueDto {
    @Expose()
    id: number;

    @Expose()
    store_id: number;

    @Expose()
    status: string;

    @Expose()
    createdBy: string;

    @Expose()
    approvedBy?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    @Type(() => MaterialIssueItemDto)
    items: MaterialIssueItemDto[];
}
