import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { CategoryService } from "./category.service";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { Tenant } from "src/entities/global/tenant.entity";
import { plainToInstance } from "class-transformer";
import { ResponseUtil } from "src/common/utils/response.util";
import { ArticleCategoryDto } from "./dto/article-category.dto";
import { CreateArticleCategoryDto } from "./dto/create-article-category.dto";

@Controller('article-categories')
@UseGuards(TenantSelectionGuard)
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Get('/all')
    async getAllCategories(
        @CurrentTenant() tenant: Tenant,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = await this.categoryService.getAllCategories(tenant, pageNum, limitNum, filter);
        const pageSize = limitNum || 10;

        const data = plainToInstance(ArticleCategoryDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Categorías de artículo consultadas correctamente',
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
        const result = await this.categoryService.getCategoryById(tenant, id);
        const data = plainToInstance(ArticleCategoryDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Categoría de artículo consultada correctamente'
        );
    }

    @Post('/create')
    async createCategory(@CurrentTenant() tenant: Tenant, @Body() createArticleCategoryDto: CreateArticleCategoryDto) {
        const result = await this.categoryService.createCategory(tenant, createArticleCategoryDto);
        const data = plainToInstance(ArticleCategoryDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Categoría de artículo creada correctamente'
        );
    }

    @Patch('/update/:id')
    async updateCategory(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() updateArticleCategoryDto: CreateArticleCategoryDto) {
        const result = await this.categoryService.updateCategory(tenant, id, updateArticleCategoryDto);
        const data = plainToInstance(ArticleCategoryDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Categoría de artículo actualizada correctamente'
        );
    }

    @Delete('/delete/:id')
    async deleteCategory(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.categoryService.deleteCategory(tenant, id);
        const data = plainToInstance(ArticleCategoryDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Categoría de artículo eliminada correctamente',
        );
    }
}