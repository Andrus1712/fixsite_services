import { Expose } from "class-transformer";

export class StoreInventoryDto {
    @Expose()
    inventory_id: number;

    @Expose()
    inventory_stock: number;

    @Expose()
    inventory_min_stock: number;

    @Expose()
    inventory_max_stock: number;

    @Expose()
    inventory_created_at: string;

    @Expose()
    inventory_updated_at: string;

    @Expose()
    stores_id: number;

    @Expose()
    stores_name: string;

    @Expose()
    stores_type: string;

    @Expose()
    articles_id: number;

    @Expose()
    articles_sku: string;

    @Expose()
    articles_name: string;

    @Expose()
    articles_description: string;

    @Expose()
    article_categories_name: string;

    @Expose()
    article_brands_name: string;

    @Expose()
    articles_unit_measurement: string;
}
