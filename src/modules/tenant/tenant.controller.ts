import { Controller, Post, Body, Get, Query } from '@nestjs/common';
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

  @Get('all')
  async getAllTenants(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.tenantService.getAllTenants(pageNum, limitNum, filter);
  }

  @Get('current')
  getCurrentTenant(@CurrentTenant() tenant: Tenant) {
    return tenant;
  }
}