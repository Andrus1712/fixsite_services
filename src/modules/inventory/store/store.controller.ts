import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { ResponseUtil } from "src/common/utils/response.util";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CreateStoreDto } from "./dto/create-store.dto";
import { StoreDto } from "./dto/store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoreService } from "./store.service";
import { StoreInventoryDto } from "./dto/store-inventory.dto";

@Controller('stores')
@UseGuards(TenantSelectionGuard)
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @Get('/all')
    async getAllStores(
        @CurrentTenant() tenant: Tenant,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = await this.storeService.getAllStores(tenant, pageNum, limitNum, filter);
        const pageSize = limitNum || 10;

        const data = plainToInstance(StoreDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Almacenes consultados correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            }
        );
    }
    @Get('/inventory/:id')
    async getStoreInventoryById(
        @CurrentTenant() tenant: Tenant,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string,
        @Param('id') id?: number
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = await this.storeService.getStoreInventory(tenant, pageNum, limitNum, filter, id);
        const pageSize = limitNum || 10;

        const data = plainToInstance(StoreInventoryDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Almacenes consultados correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            }
        );
    }

    @Get('/:id')
    async getStoreById(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number) {
        const result = await this.storeService.getStoreById(tenant, id);
        const data = plainToInstance(StoreDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Almacén consultado correctamente'
        );
    }

    @Post('/create')
    async createStore(@CurrentTenant() tenant: Tenant, @Body() createStoreDto: CreateStoreDto) {
        const result = await this.storeService.createStore(tenant, createStoreDto);
        const data = plainToInstance(StoreDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Almacén creado correctamente'
        );
    }

    @Patch('/update/:id')
    async updateStore(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() updateStoreDto: UpdateStoreDto) {
        const result = await this.storeService.updateStore(tenant, id, updateStoreDto);
        const data = plainToInstance(StoreDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Almacén actualizado correctamente'
        );
    }

    @Delete('/delete/:id')
    async deleteStore(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.storeService.deleteStore(tenant, id);
        const data = plainToInstance(StoreDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Almacén eliminado correctamente'
        );
    }

    @Put('/config-inventory/:id')
    async configMinMaxStock(
        @CurrentTenant() tenant: Tenant,
        @Param('id') inventory_id: number,
        @Body() dto: { inventory_id: string; max_stock: number; min_stock: number; alert_enabled: boolean; }
    ) {
        const result = await this.storeService.configMinMaxStock(tenant, inventory_id, dto);
        return ResponseUtil.success(result, 'Stock mínimo y máximo configurados correctamente');
    }

    @Get('/requests/all/:id')
    async getAllRequestInventoryByStoreId(
        @CurrentTenant() tenant: Tenant,
        @Param('id') storeId: number,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string,
        @Query('status') status?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const statuses = status ? status.split(',') : undefined;

        const result = await this.storeService.getAllRequestInventoryByStoreId(
            tenant,
            storeId,
            pageNum,
            limitNum,
            filter,
            statuses
        );

        return ResponseUtil.successWithPagination(
            result.data,
            'Solicitudes de inventario consultadas correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: limitNum,
                totalPages: result.totalPages,
            }
        );
    }

}
