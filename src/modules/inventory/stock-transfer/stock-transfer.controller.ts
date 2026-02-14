import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { ResponseUtil } from "src/common/utils/response.util";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CreateStockTransferDto } from "./dto/create-stock-transfer.dto";
import { StockTransferDto } from "./dto/stock-transfer.dto";
import { UpdateStockTransferDto } from "./dto/update-stock-transfer.dto";
import { StockTransferService } from "./stock-transfer.service";
import { CurrentUser } from "src/common/decorators/current-user.decorator";

@Controller('stock-transfers')
@UseGuards(TenantSelectionGuard)
export class StockTransferController {
    constructor(private readonly service: StockTransferService) { }

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
        const data = plainToInstance(StockTransferDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Transferencias consultadas correctamente',
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
        const data = plainToInstance(StockTransferDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Transferencia consultada correctamente');
    }

    @Post('/create')
    async create(
        @CurrentTenant() tenant: Tenant,
        @Body() dto: CreateStockTransferDto,
        @CurrentUser() user: any
    ) {
        const result = await this.service.create(tenant, dto, user.username);
        const data = plainToInstance(StockTransferDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Transferencia creada correctamente');
    }

    @Patch('/update/:id')
    async update(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() dto: UpdateStockTransferDto) {        
        const result = await this.service.update(tenant, id, dto);
        const data = plainToInstance(StockTransferDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Transferencia actualizada correctamente');
    }

    @Patch('/submit/:id')
    async submit(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.submit(tenant, id);
        const data = plainToInstance(StockTransferDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Transferencia enviada correctamente');
    }

    @Patch('/approve/:id')
    async approve(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @CurrentUser() user: any) {
        const result = await this.service.approve(tenant, id, user.username);
        const data = plainToInstance(StockTransferDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Transferencia aprobada correctamente');
    }

    @Patch('/reject/:id')
    async reject(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @CurrentUser() user: any) {
        const result = await this.service.reject(tenant, id, user.username);
        const data = plainToInstance(StockTransferDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Transferencia rechazada correctamente');
    }

    @Patch('/cancel/:id')
    async cancel(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.service.cancel(tenant, id);
        const data = plainToInstance(StockTransferDto, result, { excludeExtraneousValues: true });
        return ResponseUtil.success(data, 'Transferencia cancelada correctamente');
    }
}
