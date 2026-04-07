import { Expose } from "class-transformer";

export class ArticleCategoryDto {
    @Expose()
    id: number;
    @Expose()
    name: string;
    @Expose()
    created_at: Date;
    @Expose()
    updated_at: Date;
}