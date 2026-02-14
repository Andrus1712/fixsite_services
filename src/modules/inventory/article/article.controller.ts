import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { TenantSelectionGuard } from "src/modules/auth/guards/tenant-selection.guard";
import { ArticleService } from "./article.service";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { Tenant } from "src/entities/global/tenant.entity";
import { plainToInstance } from "class-transformer";
import { ResponseUtil } from "src/common/utils/response.util";
import { ArticleDto } from "./dto/article.dto";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

@Controller('articles')
@UseGuards(TenantSelectionGuard)
export class ArticleController {
    constructor(private readonly articleService: ArticleService) { }

    @Get('/all')
    async getAllArticles(
        @CurrentTenant() tenant: Tenant,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = await this.articleService.getAllArticles(tenant, pageNum, limitNum, filter);
        const pageSize = limitNum || 10;

        const data = plainToInstance(ArticleDto, result.data, { excludeExtraneousValues: true });

        return ResponseUtil.successWithPagination(
            data,
            'Artículos consultados correctamente',
            {
                total: result.total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            }
        );
    }

    @Get('/:id')
    async getArticleById(
        @CurrentTenant() tenant: Tenant,
        @Param('id') id: number) {
        const result = await this.articleService.getArticleById(tenant, id);
        const data = plainToInstance(ArticleDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Artículo consultado correctamente'
        );
    }

    @Post('/create')
    async createArticle(@CurrentTenant() tenant: Tenant, @Body() createArticleDto: CreateArticleDto) {
        const result = await this.articleService.createArticle(tenant, createArticleDto);
        const data = plainToInstance(ArticleDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Artículo creado correctamente'
        );
    }

    @Patch('/update/:id')
    async updateArticle(@CurrentTenant() tenant: Tenant, @Param('id') id: number, @Body() updateArticleDto: UpdateArticleDto) {
        const result = await this.articleService.updateArticle(tenant, id, updateArticleDto);
        const data = plainToInstance(ArticleDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Artículo actualizado correctamente'
        );
    }

    @Delete('/delete/:id')
    async deleteArticle(@CurrentTenant() tenant: Tenant, @Param('id') id: number) {
        const result = await this.articleService.deleteArticle(tenant, id);
        const data = plainToInstance(ArticleDto, result, { excludeExtraneousValues: true });

        return ResponseUtil.success(
            data,
            'Artículo eliminado correctamente',
        );
    }
}
