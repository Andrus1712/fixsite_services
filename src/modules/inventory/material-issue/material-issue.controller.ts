import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { ResponseUtil } from "src/common/utils/response.util";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CreateMaterialIssueDto } from "./dto/create-material-issue.dto";
import { MaterialIssueDto, MaterialIssueItemDto } from "./dto/material-issue.dto";
import { UpdateMaterialIssueDto } from "./dto/update-material-issue.dto";
import { MaterialIssueService } from "./material-issue.service";
import { CurrentUser } from "src/common/decorators/current-user.decorator";

@Controller('material-issues')
@UseGuards(TenantSelectionGuard)
export class MaterialIssueController {
    constructor(private readonly service: MaterialIssueService) { }

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
        const data = plainToInstance(MaterialIssueDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Salidas de material consultadas correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: limitNum,
                totalPages: result.totalPages,
            }
        );
    }

    @Get('/items')
    async getMaterialIssueItemsByDestinationReference(
        @CurrentTenant() tenant: Tenant,
        @Query('destinationReference') destinationReference: string
    ) {
        const result = await this.service.findItemsByDestinationReference(tenant, destinationReference);
        const data = plainToInstance(MaterialIssueItemDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Items de salida de material consultados correctamente');
    }

    @Get('/:id')
    async findOne(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number
    ) {
        const result = await this.service.findOne(tenant, id);
        const data = plainToInstance(MaterialIssueDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Salida de material consultada correctamente');
    }

    @Post('/create')
    async create(
        @CurrentTenant() tenant: Tenant,
        @Body() dto: CreateMaterialIssueDto,
        @CurrentUser() user: any
    ) {
        const result = await this.service.create(tenant, dto, user.username);
        const data = plainToInstance(MaterialIssueDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Salida de material creada correctamente');
    }

    @Patch('/update/:id')
    async update(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
        @Body() dto: UpdateMaterialIssueDto
    ) {
        const result = await this.service.update(tenant, id, dto);
        const data = plainToInstance(MaterialIssueDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Salida de material actualizada correctamente');
    }

    @Patch('/submit/:id')
    async submit(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number
    ) {
        const result = await this.service.submit(tenant, id);
        const data = plainToInstance(MaterialIssueDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Salida de material enviada correctamente');
    }

    @Patch('/approve/:id')
    async approve(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        const result = await this.service.approve(tenant, id, user.username);
        const data = plainToInstance(MaterialIssueDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Salida de material aprobada correctamente');
    }

    @Patch('/reject/:id')
    async reject(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        const result = await this.service.reject(tenant, id, user.username);
        const data = plainToInstance(MaterialIssueDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Salida de material rechazada correctamente');
    }

    @Patch('/cancel/:id')
    async cancel(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number
    ) {
        const result = await this.service.cancel(tenant, id);
        const data = plainToInstance(MaterialIssueDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(data, 'Salida de material cancelada correctamente');
    }
    
}
