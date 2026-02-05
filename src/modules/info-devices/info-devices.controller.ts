import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InfoDevicesService } from './info-devices.service';
import { DeviceType } from '../../entities/branch/device-type.entity';
import { DeviceBrand } from '../../entities/branch/device-brand.entity';
import { DeviceModel } from '../../entities/branch/device-model.entity';
import { PasswordType } from '../../entities/branch/password-type.entity';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';

@Controller('info-devices')
@UseGuards(TenantSelectionGuard)
export class InfoDevicesController {
  constructor(private readonly infoDevicesService: InfoDevicesService) {}

  // Device Types
  @Get('device-types')
  findAllDeviceTypes(@CurrentTenant() tenant: Tenant) {
    return this.infoDevicesService.findAllDeviceTypes(tenant);
  }

  @Get('device-types/all')
  async getAllDeviceTypes(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllDeviceTypes(tenant, pageNum, limitNum, filter);
  }

  @Get('device-types/:id')
  findOneDeviceType(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<DeviceType | null> {
    return this.infoDevicesService.findOneDeviceType(tenant, id);
  }

  @Post('device-types')
  createDeviceType(@CurrentTenant() tenant: Tenant, @Body() data: Partial<DeviceType>): Promise<DeviceType> {
    return this.infoDevicesService.createDeviceType(tenant, data);
  }

  @Put('device-types/:id')
  updateDeviceType(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() data: Partial<DeviceType>): Promise<DeviceType | null> {
    return this.infoDevicesService.updateDeviceType(tenant, id, data);
  }

  @Delete('device-types/:id')
  removeDeviceType(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removeDeviceType(tenant, id);
  }

  // Device Brands
  @Get('device-brands')
  findAllDeviceBrands(@CurrentTenant() tenant: Tenant) {
    return this.infoDevicesService.findAllDeviceBrands(tenant);
  }

  @Get('device-brands/all')
  async getAllDeviceBrands(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllDeviceBrands(tenant, pageNum, limitNum, filter);
  }

  @Get('device-brands/:id')
  findOneDeviceBrand(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<DeviceBrand | null> {
    return this.infoDevicesService.findOneDeviceBrand(tenant, id);
  }

  @Post('device-brands')
  createDeviceBrand(@CurrentTenant() tenant: Tenant, @Body() data: Partial<DeviceBrand>): Promise<DeviceBrand> {
    return this.infoDevicesService.createDeviceBrand(tenant, data);
  }

  @Put('device-brands/:id')
  updateDeviceBrand(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() data: Partial<DeviceBrand>): Promise<DeviceBrand | null> {
    return this.infoDevicesService.updateDeviceBrand(tenant, id, data);
  }

  @Delete('device-brands/:id')
  removeDeviceBrand(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removeDeviceBrand(tenant, id);
  }

  // Device Models
  @Get('device-models')
  findAllDeviceModels(@CurrentTenant() tenant: Tenant) {
    return this.infoDevicesService.findAllDeviceModels(tenant);
  }

  @Get('device-models/all')
  async getAllDeviceModels(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string,
    @Query('brandId') brandId?: string,
    @Query('typeId') typeId?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllDeviceModels(tenant, pageNum, limitNum, filter, brandId, typeId);
  }

  @Get('device-models/:id')
  findOneDeviceModel(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<DeviceModel | null> {
    return this.infoDevicesService.findOneDeviceModel(tenant, id);
  }

  @Post('device-models')
  createDeviceModel(@CurrentTenant() tenant: Tenant, @Body() data: Partial<DeviceModel>): Promise<DeviceModel> {
    return this.infoDevicesService.createDeviceModel(tenant, data);
  }

  @Put('device-models/:id')
  updateDeviceModel(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() data: Partial<DeviceModel>): Promise<DeviceModel | null> {
    return this.infoDevicesService.updateDeviceModel(tenant, id, data);
  }

  @Delete('device-models/:id')
  removeDeviceModel(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removeDeviceModel(tenant, id);
  }

  // Password Types
  @Get('password-types')
  findAllPasswordTypes(@CurrentTenant() tenant: Tenant) {
    return this.infoDevicesService.findAllPasswordTypes(tenant);
  }

  @Get('password-types/all')
  async getAllPasswordTypes(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllPasswordTypes(tenant, pageNum, limitNum, filter);
  }

  @Get('password-types/:id')
  findOnePasswordType(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<PasswordType | null> {
    return this.infoDevicesService.findOnePasswordType(tenant, id);
  }

  @Post('password-types')
  createPasswordType(@CurrentTenant() tenant: Tenant, @Body() data: Partial<PasswordType>): Promise<PasswordType> {
    return this.infoDevicesService.createPasswordType(tenant, data);
  }

  @Put('password-types/:id')
  updatePasswordType(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() data: Partial<PasswordType>): Promise<PasswordType | null> {
    return this.infoDevicesService.updatePasswordType(tenant, id, data);
  }

  @Delete('password-types/:id')
  removePasswordType(@CurrentTenant() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removePasswordType(tenant, id);
  }
}