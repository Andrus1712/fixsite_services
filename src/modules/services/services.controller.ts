import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
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
  constructor(private readonly servicesService: ServicesService) { }

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
    return this.servicesService.getAllServices(
      tenant,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      filter,
    );
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOneService(tenant, id);
  }

  @Post()
  async create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateServiceDto) {
    const data = await this.servicesService.createService(tenant, dto);
    return { success: true, status: HttpStatus.CREATED, message: 'Servicio creado exitosamente', data, errors: null };
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
  ) {
    const data = await this.servicesService.updateService(tenant, id, dto);
    return { success: true, status: HttpStatus.OK, message: 'Servicio actualizado exitosamente', data, errors: null };
  }

  @Delete(':id')
  async remove(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    await this.servicesService.removeService(tenant, id);
    return { success: true, status: HttpStatus.OK, message: 'Servicio eliminado exitosamente', data: null, errors: null };
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
    return this.servicesService.getAllOrderTypes(
      tenant,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      filter,
    );
  }

  @Get('order-types/:id')
  findOneOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOneOrderType(tenant, id);
  }

  @Post('order-types')
  async createOrderType(@CurrentTenant() tenant: Tenant, @Body() dto: CreateOrderTypeDto) {
    const data = await this.servicesService.createOrderType(tenant, dto);
    return { success: true, status: HttpStatus.CREATED, message: 'Tipo de orden creado exitosamente', data, errors: null };
  }

  @Put('order-types/:id')
  async updateOrderType(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderTypeDto,
  ) {
    const data = await this.servicesService.updateOrderType(tenant, id, dto);
    return { success: true, status: HttpStatus.OK, message: 'Tipo de orden actualizado exitosamente', data, errors: null };
  }

  @Delete('order-types/:id')
  async removeOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    await this.servicesService.removeOrderType(tenant, id);
    return { success: true, status: HttpStatus.OK, message: 'Tipo de orden eliminado exitosamente', data: null, errors: null };
  }

  // ── Service Order Types (catálogo de precios) ─────────────────────────────

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
  async createServiceOrderType(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: CreateServiceOrderTypeDto,
  ) {
    const data = await this.servicesService.createServiceOrderType(tenant, dto);
    return { success: true, status: HttpStatus.CREATED, message: 'Precio de servicio creado exitosamente', data, errors: null };
  }

  @Put('service-order-types/:id')
  async updateServiceOrderType(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceOrderTypeDto,
  ) {
    const data = await this.servicesService.updateServiceOrderType(tenant, id, dto);
    return { success: true, status: HttpStatus.OK, message: 'Precio de servicio actualizado exitosamente', data, errors: null };
  }

  @Delete('service-order-types/:id')
  async removeServiceOrderType(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    await this.servicesService.removeServiceOrderType(tenant, id);
    return { success: true, status: HttpStatus.OK, message: 'Precio de servicio eliminado exitosamente', data: null, errors: null };
  }

  // ── Available Services ────────────────────────────────────────────────────

  /**
   * Devuelve los servicios disponibles para una orden.
   * Body: { orderTypeId, orderIssueIds?: number[], orderId?: number }
   * orderIssueIds son IDs de OrderIssue (fallas reportadas) pendientes.
   */
  @Post('available')
  async findAvailableServices(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: AvailableServicesDto,
  ) {
    const raw = await this.servicesService.findAvailableServices(
      tenant,
      dto.orderTypeId,
      dto.orderIssueIds ?? [],
      dto.orderId,
    );
    const data = plainToInstance(AvailableServiceItemDto, raw, { excludeExtraneousValues: true });
    return { success: true, status: HttpStatus.OK, data, total: data.length };
  }
}
