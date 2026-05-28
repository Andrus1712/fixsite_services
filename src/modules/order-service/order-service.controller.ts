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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { OrderServiceService } from './order-service.service';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';

@Controller('orders-service')
@UseGuards(TenantSelectionGuard)
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderServiceService) { }

  @Get('all')
  async getAll(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('orderId') orderId?: string,
  ) {
    const result = await this.orderServiceService.getAll(
      tenant,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      orderId ? parseInt(orderId) : undefined,
    );
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Servicios de orden consultados correctamente',
      ...result,
    };
  }

  @Post('create')
  async create(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: CreateOrderServiceDto,
  ) {
    const data = await this.orderServiceService.create(tenant, dto, user.username);
    return {
      success: true,
      status: HttpStatus.CREATED,
      message: 'Servicio asignado a la orden exitosamente',
      data,
      errors: null,
    };
  }

  @Get(':id')
  async findOne(@CurrentTenant() tenant: Tenant, @Param('id', ParseIntPipe) id: number) {
    const data = await this.orderServiceService.findOne(tenant, id);
    return { success: true, status: HttpStatus.OK, message: 'Servicio encontrado', data, errors: null };
  }

  /** Obtiene todos los servicios aplicados a una orden, con sus fallas resueltas */
  @Get('order/:order_id')
  async findByOrderId(
    @CurrentTenant() tenant: Tenant,
    @Param('order_id', ParseIntPipe) orderId: number,
  ) {
    const data = await this.orderServiceService.findOrderServiceByOrderId(tenant, orderId);
    return { success: true, status: HttpStatus.OK, data, total: data.length };
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderServiceDto,
  ) {
    const data = await this.orderServiceService.update(tenant, id, dto);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Servicio de orden actualizado exitosamente',
      data,
      errors: null,
    };
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.orderServiceService.remove(tenant, id, user.username);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Servicio de orden eliminado exitosamente',
      data: null,
      errors: null,
    };
  }
}
