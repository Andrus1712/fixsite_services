import { Injectable } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { ArticleCategory } from "src/entities/branch/article-category.entity";
import { Tenant } from "src/entities/global/tenant.entity";

@Injectable()
export class CategoryService {
    constructor(private readonly tenantService: ConnectionDatabaseService) { }

    async getAllCategories(tenant: Tenant, page: number, limit: number, filter?: string) {
        const connection = await this.tenantService.getRepository(ArticleCategory, tenant);

        const queryBuilder = connection.createQueryBuilder('article_categories');
        if (filter) {
            queryBuilder.where('article_categories.name LIKE :filter', { filter: `%${filter}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getCategoryById(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(ArticleCategory, tenant);
        return await repository.findOne({ where: { id } });
    }

    async createCategory(tenant: Tenant, createArticleCategoryDto: any) {
        const repository = await this.tenantService.getRepository(ArticleCategory, tenant);
        const entity = repository.create(createArticleCategoryDto);
        return repository.save(entity);
    }

    async updateCategory(tenant: Tenant, id: number, updateArticleCategoryDto: any) {
        const repository = await this.tenantService.getRepository(ArticleCategory, tenant);
        await repository.update(id, updateArticleCategoryDto);
        return this.getCategoryById(tenant, id);
    }

    async deleteCategory(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(ArticleCategory, tenant);
        const category = await this.getCategoryById(tenant, id);
        if (!category) {
            throw new Error('Categoría de artículo no encontrada');
        }
        await repository.delete(id);
        return category;
    }
}