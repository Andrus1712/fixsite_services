import { IsBoolean, IsIn, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateStoreDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['bodega', 'taller', 'sucursal', 'movil'])
    type: string;

    @IsBoolean()
    active: boolean;
}
