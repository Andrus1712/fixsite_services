import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    @IsNotEmpty()
    customer_name: string;

    @IsEmail()
    @IsNotEmpty()
    customer_email: string;

    @IsString()
    @IsNotEmpty()
    customer_phone: string;

    @IsString()
    @IsNotEmpty()
    customer_address: string;

    @IsString()
    @IsNotEmpty()
    customer_city: string;

    @IsString()
    @IsNotEmpty()
    customer_country: string;

    @IsString()
    @IsNotEmpty()
    customer_type: string;

    @IsString()
    @IsNotEmpty()
    preferred_contact: string;
}
