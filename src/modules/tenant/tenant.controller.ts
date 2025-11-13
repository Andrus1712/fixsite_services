import { Controller, Post, Body, Get } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';

interface CreateTenantDto {
  name: string;
  subdomain: string;
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword: string;
}

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.createTenant(createTenantDto);
  }

  @Get('current')
  getCurrentTenant(@CurrentTenant() tenant: Tenant) {
    return tenant;
  }
}