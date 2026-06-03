import { Controller, Post, Body, UseGuards, Get, HttpStatus, Param, Query, UseInterceptors, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderIssueDto } from './dto/create-order-issue.dto';
import { UpdateOrderIssueDto } from './dto/update-order-issue.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto, IssueResponseDto } from './dto/order-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SerializeInterceptor } from 'src/common/interceptors/serialize.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AssignTechnicianOrderDto } from '../technician/dto/assign-technician-order.dto';
import { LogEventService } from '../log-events/logs-events.service';

@Controller('orders')
@UseGuards(TenantSelectionGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logEventService: LogEventService,
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

  @Get(':order_code/log-events')
  async getLogEventsByOrderCode(
    @CurrentTenant() tenant: Tenant,
    @Param('order_code') orderCode: string,
  ) {
    const order = await this.orderService.getOrderInfo(tenant, orderCode);
    const data = await this.logEventService.getLogsByOrder(tenant, order.id);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Log events consultados correctamente',
      data,
      errors: null,
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

  @UseInterceptors(new SerializeInterceptor(IssueResponseDto, { excludeExtraneousValues: true }))
  @Post('/issues/create')
  async createIssue(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: CreateOrderIssueDto,
  ) {
    const data = await this.orderService.createIssue(tenant, dto, user.username);
    return {
      success: true,
      status: HttpStatus.CREATED,
      message: 'Issue creado exitosamente',
      data,
      errors: null,
    };
  }

  @Put('/issues/:issueId')
  async updateIssue(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() dto: UpdateOrderIssueDto,
  ) {
    await this.orderService.updateIssue(tenant, issueId, dto, user.username);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Falla actualizada correctamente',
      data: null,
      errors: null,
    };
  }

  @Delete('/issues/:issueId')
  async deleteIssue(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('issueId', ParseIntPipe) issueId: number,
  ) {
    await this.orderService.deleteIssue(tenant, issueId, user.username);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Falla eliminada correctamente',
      data: null,
      errors: null,
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

  @Post('/unassign')
  async unassignTechnicianFromOrder(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body('order_code') orderCode: string,
  ) {
    const data = await this.orderService.unassignOrder(tenant, orderCode, user.username);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Técnico desasignado correctamente',
      data,
      errors: null,
    };
  }

  @Put('/update-status/:order_code')
  async updateOrderStatus(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('order_code') orderCode: string,
    @Body('status') status: number,
    @Body('notes') notes?: string,
  ) {
    const data = await this.orderService.updateOrderStatus(tenant, orderCode, status, user.username, notes);

    return {
      success: true,
      status: HttpStatus.OK,
      message: "Estado de orden actualizado correctamente",
      data,
      errors: null
    };
  }
}