import { Injectable } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { ArticleBrand } from "src/entities/branch/article-brand.entity";
import { Tenant } from "src/entities/global/tenant.entity";

@Injectable()
export class BrandService {
    constructor(private readonly tenantService: ConnectionDatabaseService) { }

    async getAllBrands(tenant: Tenant, page: number, limit: number, filter?: string) {
        const connection = await this.tenantService.getRepository(ArticleBrand, tenant);

        const queryBuilder = connection.createQueryBuilder('article_brands');
        if (filter) {
            queryBuilder.where('article_brands.name LIKE :filter', { filter: `%${filter}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getBrandById(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(ArticleBrand, tenant);
        return await repository.findOne({ where: { id } });
    }

    async createBrand(tenant: Tenant, createArticleBrandDto: any) {
        const repository = await this.tenantService.getRepository(ArticleBrand, tenant);
        const entity = repository.create(createArticleBrandDto);
        return repository.save(entity);
    }

    async updateBrand(tenant: Tenant, id: number, updateArticleBrandDto: any) {
        const repository = await this.tenantService.getRepository(ArticleBrand, tenant);
        await repository.update(id, updateArticleBrandDto);
        return this.getBrandById(tenant, id);
    }

    async deleteBrand(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(ArticleBrand, tenant);
        const brand = await this.getBrandById(tenant, id);
        if (!brand) {
            throw new Error('Marca de artículo no encontrada');
        }
        await repository.delete(id);
        return brand;
    }
}