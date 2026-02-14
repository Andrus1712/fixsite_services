import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { Tenant } from "src/entities/global/tenant.entity";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { ArticleBrandDto } from "./dto/article-brand.dto";
import { ResponseUtil } from "src/common/utils/response.util";
import { CreateArticleBrandDto } from "./dto/create-article-brand.dto";
import { BrandService } from "./brand.service";

@Controller('article-brands')
@UseGuards(TenantSelectionGuard)
export class BrandController {
    constructor(private readonly brandService: BrandService) { }

    @Get('/all')
    async getAllBrands(
        @CurrentTenant() tenant: Tenant,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;


        const result = await this.brandService.getAllBrands(tenant, pageNum, limitNum, filter);
        const pageSize = limitNum || 10;

        const data = plainToInstance(ArticleBrandDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Marcas de artículo consultadas correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            }
        );
    }

    @Get('/:id')
    async getBrandById(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number) {
        const result = await this.brandService.getBrandById(tenant, id);
        const data = plainToInstance(ArticleBrandDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Marca de artículo consultada correctamente'
        );
    }

    @Post('/create')
    async createBrand(@CurrentTenant() tenant: Tenant, @Body() createArticleBrandDto: CreateArticleBrandDto) {
        const result = await this.brandService.createBrand(tenant, createArticleBrandDto);
        const data = plainToInstance(ArticleBrandDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Marca de artículo creada correctamente'
        );
    }

    @Patch('/update/:id')
    async updateBrand(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() updateArticleBrandDto: CreateArticleBrandDto) {
        const result = await this.brandService.updateBrand(tenant, id, updateArticleBrandDto);
        const data = plainToInstance(ArticleBrandDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Marca de artículo actualizada correctamente'
        );
    }

    @Delete('/delete/:id')
    async deleteBrand(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.brandService.deleteBrand(tenant, id);
        const data = plainToInstance(ArticleBrandDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Marca de artículo eliminada correctamente'
        );
    }
}