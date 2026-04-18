import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateOrderTypeDto } from './dto/create-order-type.dto';
import { UpdateOrderTypeDto } from './dto/update-order-type.dto';
import { CreateServiceOrderTypeDto } from './dto/create-service-order-type.dto';
import { UpdateServiceOrderTypeDto } from './dto/update-service-order-type.dto';
import { plainToInstance } from 'class-transformer';
import { AvailableServicesDto } from './dto/available-services.dto';
import { AvailableServiceItemDto } from './dto/available-service-response.dto';

@Controller('services')
@UseGuards(TenantSelectionGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ── Services ──────────────────────────────────────────────────────────────

  @Get()
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.servicesService.findAllServices(tenant);
  }

  @Get('all')
  getAll(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('filter') filter?: string,
  ) {
    return this.servicesService.getAllServices(tenant, parseInt(page) || 1, parseInt(limit) || 10, filter);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOneService(tenant, id);
  }

  @Post()
  create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateServiceDto) {
    return this.servicesService.createService(tenant, dto);
  }

  @Put(':id')
  update(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.servicesService.updateService(tenant, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.removeService(tenant, id);
  }

  // ── Order Types ───────────────────────────────────────────────────────────

  @Get('order-types/list')
  findAllOrderTypes(@CurrentTenant() tenant: Tenant) {
    return this.servicesService.findAllOrderTypes(tenant);
  }

  @Get('order-types/all')
  getAllOrderTypes(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('filter') filter?: string,
  ) {
    return this.servicesService.getAllOrderTypes(tenant, parseInt(page) || 1, parseInt(limit) || 10, filter);
  }

  @Get('order-types/:id')
  findOneOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOneOrderType(tenant, id);
  }

  @Post('order-types')
  createOrderType(@CurrentTenant() tenant: Tenant, @Body() dto: CreateOrderTypeDto) {
    return this.servicesService.createOrderType(tenant, dto);
  }

  @Put('order-types/:id')
  updateOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderTypeDto) {
    return this.servicesService.updateOrderType(tenant, id, dto);
  }

  @Delete('order-types/:id')
  removeOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.removeOrderType(tenant, id);
  }

  // ── Service Order Types ───────────────────────────────────────────────────

  @Get('service-order-types/all')
  getAllServiceOrderTypes(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('serviceId') serviceId?: string,
    @Query('orderTypeId') orderTypeId?: string,
  ) {
    return this.servicesService.getAllServiceOrderTypes(
      tenant,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      serviceId ? parseInt(serviceId) : undefined,
      orderTypeId ? parseInt(orderTypeId) : undefined,
    );
  }

  @Get('service-order-types/:id')
  findOneServiceOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOneServiceOrderType(tenant, id);
  }

  @Post('service-order-types')
  createServiceOrderType(@CurrentTenant() tenant: Tenant, @Body() dto: CreateServiceOrderTypeDto) {
    return this.servicesService.createServiceOrderType(tenant, dto);
  }

  @Put('service-order-types/:id')
  updateServiceOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceOrderTypeDto) {
    return this.servicesService.updateServiceOrderType(tenant, id, dto);
  }

  @Delete('service-order-types/:id')
  removeServiceOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.removeServiceOrderType(tenant, id);
  }

  // ── Available Services ─────────────────────────────────────────────────────────────

  @Post('available')
  async findAvailableServices(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: AvailableServicesDto,
  ) {
    const raw = await this.servicesService.findAvailableServices(tenant, dto.orderTypeId, dto.issueIds ?? []);
    const data = plainToInstance(AvailableServiceItemDto, raw, { excludeExtraneousValues: true });
    return { data, total: data.length };
  }
}
