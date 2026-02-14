import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateProviderDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsNotEmpty()
    contact_info: string;
}
