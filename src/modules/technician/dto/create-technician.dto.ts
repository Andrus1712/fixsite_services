import { IsOptional, IsString } from "class-validator";

export class CreateTechnicianDto {
    @IsString()
    name: string;

    @IsString()
    email: string;
    
    @IsString()
    phone: string;
    
    @IsOptional()
    @IsString()
    certification: string;
    
    @IsOptional()
    @IsString()
    specialty: string;
    
    @IsOptional()
    @IsString()
    level: string;
}