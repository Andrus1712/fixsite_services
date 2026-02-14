import { Expose } from "class-transformer";

export class StoreDto {
    @Expose()
    id: number;
    
    @Expose()
    name: string;
    
    @Expose()
    type: string;
    
    @Expose()
    active: boolean;
    
    @Expose()
    created_at: Date;
    
    @Expose()
    updated_at: Date;
}
