import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { ResponseUtil } from "src/common/utils/response.util";
import { PurchaseOrderStatus } from "src/entities/branch/purchase-order.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { PurchaseOrderDto } from "./dto/purchase-order.dto";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto";
import { PurchaseOrderService } from "./purchase-order.service";

@Controller('purchase-orders')
@UseGuards(TenantSelectionGuard)
export class PurchaseOrderController {
    constructor(private readonly service: PurchaseOrderService) { }

    @Get('/all')
    async findAll(
        @CurrentTenant() tenant: Tenant,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = await this.service.findAll(tenant, pageNum, limitNum, filter);
        const data = plainToInstance(PurchaseOrderDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Órdenes de compra consultadas correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: limitNum,
                totalPages: result.totalPages,
            }
        );
    }

    @Get('/:id')
    async findOne(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.findOne(tenant, id);
        const data = plainToInstance(PurchaseOrderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Orden de compra consultada correctamente');
    }

    @Post('/create')
    async create(@CurrentTenant() tenant: Tenant, @Body() dto: CreatePurchaseOrderDto) {
        const result = await this.service.create(tenant, dto);
        const data = plainToInstance(PurchaseOrderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Orden de compra creada correctamente');
    }

    @Patch('/update/:id')
    async update(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() dto: UpdatePurchaseOrderDto) {
        const result = await this.service.update(tenant, id, dto);
        const data = plainToInstance(PurchaseOrderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Orden de compra actualizada correctamente');
    }

    @Patch('/send/:id')
    async send(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.changeStatus(tenant, id, PurchaseOrderStatus.SENT);
        const data = plainToInstance(PurchaseOrderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Orden de compra enviada correctamente');
    }

    @Patch('/close/:id')
    async close(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.changeStatus(tenant, id, PurchaseOrderStatus.CLOSED);
        const data = plainToInstance(PurchaseOrderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Orden de compra cerrada correctamente');
    }

    @Patch('/cancel/:id')
    async cancel(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.changeStatus(tenant, id, PurchaseOrderStatus.CANCELLED);
        const data = plainToInstance(PurchaseOrderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Orden de compra cancelada correctamente');
    }

    @Delete('/delete/:id')
    async delete(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.delete(tenant, id);
        const data = plainToInstance(PurchaseOrderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Orden de compra eliminada correctamente');
    }
}
