import { Controller, Post, Body, UseGuards, Get, HttpStatus, Param, Query, UseInterceptors } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SerializeInterceptor } from 'src/common/interceptors/serialize.interceptor';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LogStatus, LogType } from 'src/entities/branch/log-events.entity';
import { LogEventService } from '../log-events/logs-events.service';
import { AssignTechnicianOrderDto } from '../technician/dto/assign-technician-order.dto';

@Controller('orders')
@UseGuards(TenantSelectionGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logEventService: LogEventService
  ) { }

  @UseInterceptors(new SerializeInterceptor(OrderResponseDto, { excludeExtraneousValues: true }))
  @Post('/create')
  async create(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto
  ) {

    const data = await this.orderService.create(tenant, createOrderDto, user.username);

    return {
      success: true,
      status: HttpStatus.CREATED,
      message: "Registro creado exitosamente",
      data,
      errors: null
    };
  }

  @Get('/all')
  async getAllOrders(
    @CurrentTenant() tenant: Tenant,
    @Query() query: PaginationQueryDto,
  ) {
    const { page, limit, filter } = query;
    const result = await this.orderService.getAllOrders(tenant, page, limit, filter);

    const data = plainToInstance(OrderResponseDto, result.items);

    const pageSize = limit || 10;

    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Ordenes consultadas correctamente',
      data,
      pagination: {
        total: result.total,
        page,
        limit: pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  @UseInterceptors(new SerializeInterceptor(OrderResponseDto, { excludeExtraneousValues: true }))
  @Get(':order_code')
  async getOrderInfo(
    @CurrentTenant() tenant: Tenant,
    @Param('order_code') orderCode: string,
  ) {
    const data = await this.orderService.getOrderInfo(tenant, orderCode);
    return {
      success: true,
      status: HttpStatus.OK,
      message: "Orden consultada correctamente",
      data,
      errors: null
    };
  }

  @Post('/assign')
  async asignTechnicianToOrder(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() body: AssignTechnicianOrderDto
  ) {
    const data = await this.orderService.assignOrder(tenant, body, user.username);
    return {
      success: true,
      status: HttpStatus.OK,
      message: "Orden asignada correctamente",
      data,
      errors: null
    };
  }
}