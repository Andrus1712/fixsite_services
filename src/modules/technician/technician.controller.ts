import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { TechnicianService } from "./technician.service";
import { TenantSelectionGuard } from "../auth/guards/tenant-selection.guard";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { Tenant } from "src/entities/global/tenant.entity";
import { plainToInstance } from "class-transformer";
import { TechnicianResponseDto } from "./dto/technician-response.dto";
import { CreateTechnicianDto } from "./dto/create-technician.dto";
import { ResponseUtil } from "src/common/utils/response.util";

@Controller('technicians')
@UseGuards(TenantSelectionGuard)
export class TechnicianController {
    constructor(private readonly technicianService: TechnicianService) { }

    @Get('/all')
    async getAllTechnicians(
        @CurrentTenant() tenant: Tenant,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = await this.technicianService.getAllTechnicians(tenant, pageNum, limitNum, filter);
        const pageSize = limitNum || 10;

        const data = plainToInstance(TechnicianResponseDto, result.data);

        return ResponseUtil.successWithPagination(
            data,
            'Técnicos consultados correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            }
        );
    }

    @Post('/create')
    async createTechnician(@CurrentTenant() tenant: Tenant, @Body() createTechnicianDto: CreateTechnicianDto) {
        const result = await this.technicianService.createTechnician(tenant, createTechnicianDto);
        const data = plainToInstance(TechnicianResponseDto, result);

        return ResponseUtil.success(
            data,
            'Técnico creado correctamente',
            HttpStatus.CREATED
        );
    }
}