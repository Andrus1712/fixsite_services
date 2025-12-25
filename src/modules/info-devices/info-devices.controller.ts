import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InfoDevicesService } from './info-devices.service';
import { DeviceType } from '../../entities/global/device-type.entity';
import { DeviceBrand } from '../../entities/global/device-brand.entity';
import { DeviceModel } from '../../entities/global/device-model.entity';
import { PasswordType } from '../../entities/global/password-type.entity';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';

@Controller('info-devices')
@UseGuards(TenantSelectionGuard)
export class InfoDevicesController {
  constructor(private readonly infoDevicesService: InfoDevicesService) {}

  // Device Types
  @Get('device-types')
  findAllDeviceTypes() {
    return this.infoDevicesService.findAllDeviceTypes();
  }

  @Get('device-types/all')
  async getAllDeviceTypes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllDeviceTypes(pageNum, limitNum, filter);
  }

  @Get('device-types/:id')
  findOneDeviceType(@Param('id') id: string): Promise<DeviceType | null> {
    return this.infoDevicesService.findOneDeviceType(id);
  }

  @Post('device-types')
  createDeviceType(@Body() data: Partial<DeviceType>): Promise<DeviceType> {
    return this.infoDevicesService.createDeviceType(data);
  }

  @Put('device-types/:id')
  updateDeviceType(@Param('id') id: string, @Body() data: Partial<DeviceType>): Promise<DeviceType | null> {
    return this.infoDevicesService.updateDeviceType(id, data);
  }

  @Delete('device-types/:id')
  removeDeviceType(@Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removeDeviceType(id);
  }

  // Device Brands
  @Get('device-brands')
  findAllDeviceBrands() {
    return this.infoDevicesService.findAllDeviceBrands();
  }

  @Get('device-brands/all')
  async getAllDeviceBrands(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllDeviceBrands(pageNum, limitNum, filter);
  }

  @Get('device-brands/:id')
  findOneDeviceBrand(@Param('id') id: string): Promise<DeviceBrand | null> {
    return this.infoDevicesService.findOneDeviceBrand(id);
  }

  @Post('device-brands')
  createDeviceBrand(@Body() data: Partial<DeviceBrand>): Promise<DeviceBrand> {
    return this.infoDevicesService.createDeviceBrand(data);
  }

  @Put('device-brands/:id')
  updateDeviceBrand(@Param('id') id: string, @Body() data: Partial<DeviceBrand>): Promise<DeviceBrand | null> {
    return this.infoDevicesService.updateDeviceBrand(id, data);
  }

  @Delete('device-brands/:id')
  removeDeviceBrand(@Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removeDeviceBrand(id);
  }

  // Device Models
  @Get('device-models')
  findAllDeviceModels() {
    return this.infoDevicesService.findAllDeviceModels();
  }

  @Get('device-models/all')
  async getAllDeviceModels(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string,
    @Query('brandId') brandId?: string,
    @Query('typeId') typeId?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllDeviceModels(pageNum, limitNum, filter, brandId, typeId);
  }

  @Get('device-models/:id')
  findOneDeviceModel(@Param('id') id: string): Promise<DeviceModel | null> {
    return this.infoDevicesService.findOneDeviceModel(id);
  }

  @Post('device-models')
  createDeviceModel(@Body() data: Partial<DeviceModel>): Promise<DeviceModel> {
    return this.infoDevicesService.createDeviceModel(data);
  }

  @Put('device-models/:id')
  updateDeviceModel(@Param('id') id: string, @Body() data: Partial<DeviceModel>): Promise<DeviceModel | null> {
    return this.infoDevicesService.updateDeviceModel(id, data);
  }

  @Delete('device-models/:id')
  removeDeviceModel(@Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removeDeviceModel(id);
  }

  // Password Types
  @Get('password-types')
  findAllPasswordTypes() {
    return this.infoDevicesService.findAllPasswordTypes();
  }

  @Get('password-types/all')
  async getAllPasswordTypes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.infoDevicesService.getAllPasswordTypes(pageNum, limitNum, filter);
  }

  @Get('password-types/:id')
  findOnePasswordType(@Param('id') id: string): Promise<PasswordType | null> {
    return this.infoDevicesService.findOnePasswordType(id);
  }

  @Post('password-types')
  createPasswordType(@Body() data: Partial<PasswordType>): Promise<PasswordType> {
    return this.infoDevicesService.createPasswordType(data);
  }

  @Put('password-types/:id')
  updatePasswordType(@Param('id') id: string, @Body() data: Partial<PasswordType>): Promise<PasswordType | null> {
    return this.infoDevicesService.updatePasswordType(id, data);
  }

  @Delete('password-types/:id')
  removePasswordType(@Param('id') id: string): Promise<void> {
    return this.infoDevicesService.removePasswordType(id);
  }
}