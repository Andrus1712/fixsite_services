import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';

@Controller('orders')
@UseGuards(TenantSelectionGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @TenantId() tenantId: string,
  ) {
    return this.orderService.create(createOrderDto, tenantId);
  }

  @Get()
  async getAllOrders(@TenantId() tenantId: string) {
    return await this.orderService.getAllOrders(tenantId);
  }
}