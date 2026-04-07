import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { ResponseUtil } from "src/common/utils/response.util";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CreateMaterialReceiptDto } from "./dto/create-material-receipt.dto";
import { MaterialReceiptDto } from "./dto/material-receipt.dto";
import { UpdateMaterialReceiptDto } from "./dto/update-material-receipt.dto";
import { MaterialReceiptService } from "./material-receipt.service";
import { CurrentUser } from "src/common/decorators/current-user.decorator";

@Controller('material-receipts')
@UseGuards(TenantSelectionGuard)
export class MaterialReceiptController {
    constructor(private readonly service: MaterialReceiptService) { }

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
        const data = plainToInstance(MaterialReceiptDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Recepciones de material consultadas correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: limitNum,
                totalPages: result.totalPages,
            }
        );
    }

    @Get('/:id')
    async findOne(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number
    ) {
        const result = await this.service.findOne(tenant, id);
        const data = plainToInstance(MaterialReceiptDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Recepción de material consultada correctamente');
    }

    @Post('/create')
    async create(
        @CurrentTenant() tenant: Tenant,
        @Body() dto: CreateMaterialReceiptDto,
        @CurrentUser() user: any
    ) {
        const result = await this.service.create(tenant, dto, user.username);
        const data = plainToInstance(MaterialReceiptDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Recepción de material creada correctamente');
    }

    @Patch('/update/:id')
    async update(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
        @Body() dto: UpdateMaterialReceiptDto
    ) {
        const result = await this.service.update(tenant, id, dto);
        const data = plainToInstance(MaterialReceiptDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Recepción de material actualizada correctamente');
    }

    @Patch('/submit/:id')
    async submit(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number
    ) {
        const result = await this.service.submit(tenant, id);
        const data = plainToInstance(MaterialReceiptDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Recepción de material enviada correctamente');
    }

    @Patch('/approve/:id')
    async approve(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        const result = await this.service.approve(tenant, id, user.username);
        const data = plainToInstance(MaterialReceiptDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Recepción de material aprobada correctamente');
    }

    @Patch('/reject/:id')
    async reject(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        const result = await this.service.reject(tenant, id, user.username);
        const data = plainToInstance(MaterialReceiptDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Recepción de material rechazada correctamente');
    }

    @Patch('/cancel/:id')
    async cancel(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number
    ) {
        const result = await this.service.cancel(tenant, id);
        const data = plainToInstance(MaterialReceiptDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Recepción de material cancelada correctamente');
    }

    @Get('/testSocket/emit')
    async testSocket(
        @CurrentTenant() tenant: Tenant
    ) {
        await this.service.testSocket(tenant);
        return { message: 'Socket test successful' };
    }
}
