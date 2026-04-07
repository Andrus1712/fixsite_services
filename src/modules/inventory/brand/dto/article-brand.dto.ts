import { Expose } from "class-transformer";

export class ArticleBrandDto {
    @Expose()
    id: number;
    @Expose()
    name: string;
    @Expose()
    created_at: Date;
    @Expose()
    updated_at: Date;
}