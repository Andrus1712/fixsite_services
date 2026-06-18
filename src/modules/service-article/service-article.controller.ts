import {
    Controller,
    Get,
    Post,
    Patch,
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
import { Tenant } from '../../entities/global/tenant.entity';
import { ServiceArticleService } from './service-article.service';
import { CreateServiceArticleDto } from './dto/create-service-article.dto';
import { UpdateServiceArticleDto } from './dto/update-service-article.dto';
import { QueryServiceArticleDto } from './dto/query-service-article.dto';


@Controller('service-articles')
@UseGuards(TenantSelectionGuard)
export class ServiceArticleController {
    constructor(private readonly serviceArticleService: ServiceArticleService) { }

    @Get()
    async findAll(
        @CurrentTenant() tenant: Tenant,
        @Query() query: QueryServiceArticleDto,
    ) {
        const { service_id, page, limit, filter } = query;
        const result = await this.serviceArticleService.findAll(
            tenant,
            service_id,
            page,
            limit,
            filter,
        );
        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Artículos del servicio consultados correctamente',
            data: result.items,
            pagination: {
                total: result.total,
                page: page || 1,
                limit: limit || 10,
                totalPages: Math.ceil(result.total / (limit || 10)),
            },
        };
    }

    @Post()
    async create(
        @CurrentTenant() tenant: Tenant,
        @Body() dto: CreateServiceArticleDto,
    ) {
        const data = await this.serviceArticleService.create(tenant, dto);
        return {
            success: true,
            status: HttpStatus.CREATED,
            message: 'Artículo de servicio creado exitosamente',
            data,
            errors: null,
        };
    }

    @Patch(':id')
    async update(
        @CurrentTenant() tenant: Tenant,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateServiceArticleDto,
    ) {
        const data = await this.serviceArticleService.update(tenant, id, dto);
        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Artículo de servicio actualizado exitosamente',
            data,
            errors: null,
        };
    }

    @Delete(':id')
    async remove(
        @CurrentTenant() tenant: Tenant,
        @Param('id', ParseIntPipe) id: number,
    ) {
        await this.serviceArticleService.remove(tenant, id);
        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Artículo de servicio eliminado exitosamente',
            data: null,
            errors: null,
        };
    }
}
