import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FailureCategory } from '../../entities/branch/failure-categories.entity';
import { FailureCode } from '../../entities/branch/failure-codes.entity';
import { FailureSeverity } from '../../entities/branch/failure-severities.entity';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
@UseGuards(TenantSelectionGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) { }

  // Failure Categories
  @Get('failure-categories')
  findAllFailureCategories(@CurrentTenant() tenant: Tenant) {
    return this.maintenanceService.findAllFailureCategories(tenant);
  }

  @Get('failure-categories/all')
  async getAllFailureCategories(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.maintenanceService.getAllFailureCategories(tenant, pageNum, limitNum, filter);
  }

  @Get('failure-categories/:id')
  findOneFailureCategory(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<FailureCategory | null> {
    return this.maintenanceService.findOneFailureCategory(tenant, id);
  }

  @Post('failure-categories')
  createFailureCategory(@CurrentTenant() tenant: Tenant, @Body() data: Partial<FailureCategory>): Promise<FailureCategory> {
    return this.maintenanceService.createFailureCategory(tenant, data);
  }

  @Put('failure-categories/:id')
  updateFailureCategory(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() data: Partial<FailureCategory>): Promise<FailureCategory | null> {
    return this.maintenanceService.updateFailureCategory(tenant, id, data);
  }

  @Delete('failure-categories/:id')
  removeFailureCategory(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.maintenanceService.removeFailureCategory(tenant, id);
  }

  // Failure Codes
  @Get('failure-codes')
  findAllFailureCodes(@CurrentTenant() tenant: Tenant) {
    return this.maintenanceService.findAllFailureCodes(tenant);
  }

  @Get('failure-codes/all')
  async getAllFailureCodes(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string,
    @Query('categoryId') categoryId?: string,
    @Query('deviceTypeId') deviceTypeId?: string,
    @Query('severityId') severityId?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.maintenanceService.getAllFailureCodes(tenant, pageNum, limitNum, filter, categoryId, deviceTypeId, severityId);
  }

  @Get('failure-codes/:id')
  findOneFailureCode(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<FailureCode | null> {
    return this.maintenanceService.findOneFailureCode(tenant, id);
  }

  @Post('failure-codes')
  createFailureCode(@CurrentTenant() tenant: Tenant, @Body() data: Partial<FailureCode>): Promise<FailureCode> {
    return this.maintenanceService.createFailureCode(tenant, data);
  }

  @Put('failure-codes/:id')
  updateFailureCode(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() data: Partial<FailureCode>): Promise<FailureCode | null> {
    return this.maintenanceService.updateFailureCode(tenant, id, data);
  }

  @Delete('failure-codes/:id')
  removeFailureCode(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.maintenanceService.removeFailureCode(tenant, id);
  }

  // Failure Severities
  @Get('failure-severities')
  findAllFailureSeverities(@CurrentTenant() tenant: Tenant) {
    return this.maintenanceService.findAllFailureSeverities(tenant);
  }

  @Get('failure-severities/all')
  async getAllFailureSeverities(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.maintenanceService.getAllFailureSeverities(tenant, pageNum, limitNum, filter);
  }

  @Get('failure-severities/:id')
  findOneFailureSeverity(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<FailureSeverity | null> {
    return this.maintenanceService.findOneFailureSeverity(tenant, id);
  }

  @Post('failure-severities')
  createFailureSeverity(@CurrentTenant() tenant: Tenant, @Body() data: Partial<FailureSeverity>): Promise<FailureSeverity> {
    return this.maintenanceService.createFailureSeverity(tenant, data);
  }

  @Put('failure-severities/:id')
  updateFailureSeverity(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() data: Partial<FailureSeverity>): Promise<FailureSeverity | null> {
    return this.maintenanceService.updateFailureSeverity(tenant, id, data);
  }

  @Delete('failure-severities/:id')
  removeFailureSeverity(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.maintenanceService.removeFailureSeverity(tenant, id);
  }
}