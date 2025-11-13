import { IsString, IsNotEmpty } from 'class-validator';

export class SelectTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}