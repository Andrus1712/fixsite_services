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
