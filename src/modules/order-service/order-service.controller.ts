import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { OrderServiceService } from './order-service.service';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';

@Controller('orders-service')
@UseGuards(TenantSelectionGuard)
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderServiceService) { }

  @Get('all')
  getAll(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('orderId') orderId?: string,
  ) {
    return this.orderServiceService.getAll(
      tenant,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      orderId ? parseInt(orderId) : undefined,
    );
  }

  @Post('create')
  create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateOrderServiceDto) {
    return this.orderServiceService.create(tenant, dto);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.orderServiceService.findOne(tenant, id);
  }

  @Get('order/:order_id')
  async findOrderServiceByOrderId(
    @CurrentTenant() tenant: Tenant,
    @Param('order_id', ParseIntPipe) id: number
  ) {
    const raw = await this.orderServiceService.findOrderServiceByOrderId(tenant, id);
    return { data: raw, total: raw.length };
  }

  @Put(':id')
  update(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderServiceDto) {
    return this.orderServiceService.update(tenant, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    return this.orderServiceService.remove(tenant, id);
  }
}
