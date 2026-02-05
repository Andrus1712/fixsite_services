import { Expose } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class AssignTechnicianOrderDto {
    @Expose({ name: 'order_code' })
    @IsString()
    @IsNotEmpty({ message: "orderCode should not be empty" })
    orderCode: string;

    @Expose({ name: 'technician_id' })
    @IsNumber()
    @IsNotEmpty({ message: "technicianId should not be empty" })
    technicianId: number;
}