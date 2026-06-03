import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Tenant } from 'src/entities/global/tenant.entity';
import { ServiceArticle } from 'src/entities/branch/service-article.entity';
import { Service } from 'src/entities/branch/service.entity';
import { Article } from 'src/entities/branch/article.entity';
import { CreateServiceArticleDto } from './dto/create-service-article.dto';
import { UpdateServiceArticleDto } from './dto/update-service-article.dto';

@Injectable()
export class ServiceArticleService {
    constructor(private readonly tenantService: ConnectionDatabaseService) { }

    async findAll(tenant: Tenant, serviceId: number, page = 1, limit = 10, filter?: string) {
        const repo = await this.tenantService.getRepository(ServiceArticle, tenant);

        const qb = repo.createQueryBuilder('sa')
            .leftJoinAndSelect('sa.article', 'article')
            .where('sa.service_id = :serviceId', { serviceId });

        if (filter) {
            qb.andWhere(
                '(article.name LIKE :filter OR article.sku LIKE :filter)',
                { filter: `%${filter}%` },
            );
        }

        const [items, total] = await qb
            .select([
                'sa.id',
                'sa.service_id',
                'sa.article_id',
                'sa.default_quantity',
                'sa.is_active',
                'sa.createdAt',
                'sa.updatedAt',
                'article.id',
                'article.sku',
                'article.name',
                'article.unit_measurement',
                'article.active',
            ])
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('sa.id', 'DESC')
            .getManyAndCount();

        return { items, total };
    }

    async create(tenant: Tenant, dto: CreateServiceArticleDto) {
        const serviceRepo = await this.tenantService.getRepository(Service, tenant);
        const articleRepo = await this.tenantService.getRepository(Article, tenant);
        const saRepo = await this.tenantService.getRepository(ServiceArticle, tenant);

        // Validate Service exists and has requires_articles=true
        const service = await serviceRepo.findOne({ where: { id: dto.service_id } });
        if (!service) {
            throw new NotFoundException(`Servicio con ID ${dto.service_id} no encontrado`);
        }
        if (!service.requires_articles) {
            throw new BadRequestException(
                'El servicio no permite configuración de artículos (requires_articles = false)',
            );
        }

        // Validate Article exists and is active
        const article = await articleRepo.findOne({ where: { id: dto.article_id } });
        if (!article || !article.active) {
            throw new BadRequestException(
                `El artículo con ID ${dto.article_id} no está disponible`,
            );
        }

        // Create and save
        try {
            const entity = saRepo.create(dto);
            return await saRepo.save(entity);
        } catch (error) {
            if (error?.code === '23505') {
                throw new ConflictException(
                    'El artículo ya está configurado para este servicio',
                );
            }
            throw error;
        }
    }

    async update(tenant: Tenant, id: number, dto: UpdateServiceArticleDto) {
        const repo = await this.tenantService.getRepository(ServiceArticle, tenant);
        const item = await repo.findOne({ where: { id } });
        if (!item) {
            throw new NotFoundException(`ServiceArticle con ID ${id} no encontrado`);
        }

        Object.assign(item, dto);
        return repo.save(item);
    }

    async remove(tenant: Tenant, id: number) {
        const repo = await this.tenantService.getRepository(ServiceArticle, tenant);
        const item = await repo.findOne({ where: { id } });
        if (!item) {
            throw new NotFoundException(`ServiceArticle con ID ${id} no encontrado`);
        }
        await repo.delete(id);
    }

    async validateArticlesForService(
        tenant: Tenant,
        serviceId: number,
        articleIds: number[],
    ): Promise<void> {
        const repo = await this.tenantService.getRepository(ServiceArticle, tenant);

        const activeRecords = await repo
            .createQueryBuilder('sa')
            .where('sa.service_id = :serviceId', { serviceId })
            .andWhere('sa.article_id IN (:...articleIds)', { articleIds })
            .andWhere('sa.is_active = true')
            .getMany();

        const foundIds = new Set(activeRecords.map(r => r.article_id));

        for (const articleId of articleIds) {
            if (!foundIds.has(articleId)) {
                throw new BadRequestException(
                    `El artículo ${articleId} no está permitido para este servicio`,
                );
            }
        }
    }
}
