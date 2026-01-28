import { Controller, Post, Body, UseGuards, Get, HttpStatus, Param, Query, Patch, Delete } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('customers')
@UseGuards(TenantSelectionGuard)
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Post()
    async create(
        @CurrentTenant() tenant: Tenant,
        @Body() createCustomerDto: CreateCustomerDto
    ) {
        const data = await this.customerService.create(tenant, createCustomerDto);
        return {
            success: true,
            status: HttpStatus.CREATED,
            message: "Cliente creado exitosamente",
            data,
            errors: null
        };
    }

    @Get()
    async findAll(
        @CurrentTenant() tenant: Tenant,
        @Query() query: PaginationQueryDto,
    ) {
        const { page, limit, filter } = query;
        const result = await this.customerService.findAll(tenant, page, limit, filter);
        const pageSize = limit || 10;

        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Clientes consultados correctamente',
            data: result.items,
            pagination: {
                total: result.total,
                page,
                limit: pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            },
        };
    }

    @Get(':id')
    async findOne(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
    ) {
        const data = await this.customerService.findOne(tenant, id);
        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Cliente consultado correctamente',
            data,
            errors: null
        };
    }

    @Patch(':id')
    async update(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
        @Body() updateCustomerDto: UpdateCustomerDto
    ) {
        const data = await this.customerService.update(tenant, id, updateCustomerDto);
        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Cliente actualizado exitosamente',
            data,
            errors: null
        };
    }

    @Delete(':id')
    async remove(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number,
    ) {
        await this.customerService.remove(tenant, id);
        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Cliente eliminado exitosamente',
            data: null,
            errors: null
        };
    }
}
