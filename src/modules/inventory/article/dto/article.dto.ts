import { Expose } from "class-transformer";

export class ArticleDto {
    @Expose()
    id: number;
    @Expose()
    name: string;
    @Expose()
    sku: string;
    @Expose()
    description: string;
    @Expose()
    category_id: number;
    @Expose()
    brand_id: number;
    @Expose()
    unit_measurement: string;
    @Expose()
    active: boolean;
    @Expose()
    created_at: Date;
    @Expose()
    updated_at: Date;
}