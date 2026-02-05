import { Expose } from "class-transformer";

export class TechnicianResponseDto {
    @Expose()
    id: number;
    @Expose()
    name: string;
    @Expose()
    email: string;
    @Expose()
    phone: string;
    @Expose()
    specialty: string;

    @Expose()
    level: string;

    @Expose()
    certification: string;
}