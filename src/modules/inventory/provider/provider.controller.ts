import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { ResponseUtil } from "src/common/utils/response.util";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { ProviderDto } from "./dto/provider.dto";
import { UpdateProviderDto } from "./dto/update-provider.dto";
import { ProviderService } from "./provider.service";

@Controller('providers')
@UseGuards(TenantSelectionGuard)
export class ProviderController {
    constructor(private readonly service: ProviderService) { }

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
        const data = plainToInstance(ProviderDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Proveedores consultados correctamente',
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
        const data = plainToInstance(ProviderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Proveedor consultado correctamente');
    }

    @Post('/create')
    async create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateProviderDto) {
        const result = await this.service.create(tenant, dto);
        const data = plainToInstance(ProviderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Proveedor creado correctamente');
    }

    @Patch('/update/:id')
    async update(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() dto: UpdateProviderDto) {
        const result = await this.service.update(tenant, id, dto);
        const data = plainToInstance(ProviderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Proveedor actualizado correctamente');
    }

    @Delete('/delete/:id')
    async delete(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.delete(tenant, id);
        const data = plainToInstance(ProviderDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Proveedor eliminado correctamente');
    }
}
