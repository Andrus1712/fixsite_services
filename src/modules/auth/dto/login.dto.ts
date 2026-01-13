import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
    @IsString()
    username: string;

    @IsString()
    @MinLength(4)
    @Transform(({ value }) => value.trim())
    password: string;
}