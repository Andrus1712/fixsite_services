import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';

@Controller('orders')
@UseGuards(TenantSelectionGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('/create')
  async create(
    @CurrentTenant() tenant: Tenant,
    @Body() createOrderDto: CreateOrderDto
  ) {
    return this.orderService.create(tenant, createOrderDto);
  }

  @Get()
  async getAllOrders(@CurrentTenant() tenant: Tenant) {
    return await this.orderService.getAllOrders(tenant);
  }
}