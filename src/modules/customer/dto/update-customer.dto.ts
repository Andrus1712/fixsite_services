import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCustomerDto {
    @IsString()
    @IsOptional()
    customer_name?: string;

    @IsEmail()
    @IsOptional()
    customer_email?: string;

    @IsString()
    @IsOptional()
    customer_phone?: string;

    @IsString()
    @IsOptional()
    customer_address?: string;

    @IsString()
    @IsOptional()
    customer_city?: string;

    @IsString()
    @IsOptional()
    customer_country?: string;

    @IsString()
    @IsOptional()
    customer_type?: string;

    @IsString()
    @IsOptional()
    preferred_contact?: string;
}
