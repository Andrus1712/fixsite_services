import { Expose } from "class-transformer";

export class ProviderDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    contact_info: string;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;
}
