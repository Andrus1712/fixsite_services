import { Injectable } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { Article } from "src/entities/branch/article.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

@Injectable()
export class ArticleService {
    constructor(private readonly tenantService: ConnectionDatabaseService) { }

    async getAllArticles(tenant: Tenant, page: number, limit: number, filter?: string) {
        const repository = await this.tenantService.getRepository(Article, tenant);

        const queryBuilder = repository.createQueryBuilder('articles')
            .leftJoinAndSelect('articles.category', 'category')
            .leftJoinAndSelect('articles.brand', 'brand');

        if (filter) {
            queryBuilder.where('articles.name LIKE :filter OR articles.sku LIKE :filter', { filter: `%${filter}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getArticleById(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(Article, tenant);
        return await repository.findOne({
            where: { id },
            relations: ['category', 'brand']
        });
    }

    async createArticle(tenant: Tenant, createArticleDto: CreateArticleDto) {
        const repository = await this.tenantService.getRepository(Article, tenant);
        const entity = repository.create(createArticleDto);
        return repository.save(entity);
    }

    async updateArticle(tenant: Tenant, id: number, updateArticleDto: UpdateArticleDto) {
        const repository = await this.tenantService.getRepository(Article, tenant);
        await repository.update(id, updateArticleDto);
        return this.getArticleById(tenant, id);
    }

    async deleteArticle(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(Article, tenant);
        const article = await this.getArticleById(tenant, id);
        if (!article) {
            throw new Error('Artículo no encontrado');
        }
        await repository.delete(id);
        return article;
    }
}
