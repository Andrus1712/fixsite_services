import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { ResponseUtil } from "src/common/utils/response.util";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CreateInventoryAdjustmentDto } from "./dto/create-inventory-adjustment.dto";
import { InventoryAdjustmentDto } from "./dto/inventory-adjustment.dto";
import { UpdateInventoryAdjustmentDto } from "./dto/update-inventory-adjustment.dto";
import { InventoryAdjustmentService } from "./inventory-adjustment.service";
import { CurrentUser } from "src/common/decorators/current-user.decorator";

@Controller('inventory-adjustments')
@UseGuards(TenantSelectionGuard)
export class InventoryAdjustmentController {
    constructor(private readonly service: InventoryAdjustmentService) { }

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
        const data = plainToInstance(InventoryAdjustmentDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Ajustes de inventario consultados correctamente',
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
        const data = plainToInstance(InventoryAdjustmentDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Ajuste de inventario consultado correctamente');
    }

    @Post('/create')
    async create(
        @CurrentTenant() tenant: Tenant,
        @Body() dto: CreateInventoryAdjustmentDto,
        @CurrentUser() user: any
    ) { 
        const result = await this.service.create(tenant, dto, user.username);
        const data = plainToInstance(InventoryAdjustmentDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Ajuste de inventario creado correctamente');
    }

    @Patch('/update/:id')
    async update(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() dto: UpdateInventoryAdjustmentDto) {
        const result = await this.service.update(tenant, id, dto);
        const data = plainToInstance(InventoryAdjustmentDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Ajuste de inventario actualizado correctamente');
    }

    @Patch('/submit/:id')
    async submit(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.submit(tenant, id);
        const data = plainToInstance(InventoryAdjustmentDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Ajuste de inventario enviado correctamente');
    }

    @Patch('/approve/:id')
    async approve(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @CurrentUser() user: any) {
        const result = await this.service.approve(tenant, id, user.username);
        const data = plainToInstance(InventoryAdjustmentDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Ajuste de inventario aprobado correctamente');
    }

    @Patch('/reject/:id')
    async reject(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @CurrentUser() user: any) {
        const result = await this.service.reject(tenant, id, user.username);
        const data = plainToInstance(InventoryAdjustmentDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Ajuste de inventario rechazado correctamente');
    }
}
