import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { MaterialIssue, MaterialIssueStatus } from "src/entities/branch/material-issues.entity";
import { MaterialIssueItem } from "src/entities/branch/material-issue-items.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { InventoryService } from "../inventory-core/inventory.service";
import { CreateMaterialIssueDto } from "./dto/create-material-issue.dto";
import { UpdateMaterialIssueDto } from "./dto/update-material-issue.dto";
import { MovementType } from "src/entities/branch/movement.entity";

@Injectable()
export class MaterialIssueService {
    constructor(
        private readonly tenantService: ConnectionDatabaseService,
        private readonly inventoryService: InventoryService
    ) { }

    async create(tenant: Tenant, dto: CreateMaterialIssueDto, userId: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const issueRepo = connection.getRepository(MaterialIssue);
        const itemRepo = connection.getRepository(MaterialIssueItem);

        const issue = issueRepo.create({
            store: { id: dto.store_id } as any,
            status: MaterialIssueStatus.DRAFT,
            createdBy: userId,
            createdAt: new Date()
        });

        const savedIssue = await issueRepo.save(issue);

        // Crear items
        const items = dto.items.map(item => itemRepo.create({
            issue: savedIssue,
            article: { id: item.article_id } as any,
            quantity: item.quantity,
            destinationReference: item.destinationReference
        }));

        await itemRepo.save(items);

        return this.findOne(tenant, savedIssue.id);
    }

    async findAll(tenant: Tenant, page: number, limit: number, filter?: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(MaterialIssue);

        const queryBuilder = repository.createQueryBuilder('issue')
            .leftJoinAndSelect('issue.store', 'store')
            .leftJoinAndSelect('issue.items', 'items')
            .leftJoinAndSelect('items.article', 'article');

        if (filter) {
            queryBuilder.where('store.name LIKE :filter', { filter: `%${filter}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(tenant: Tenant, id: number) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(MaterialIssue);

        const issue = await repository.findOne({
            where: { id },
            relations: ['store', 'items', 'items.article']
        });

        if (!issue) {
            throw new NotFoundException('Salida de material no encontrada');
        }

        return issue;
    }

    async findItemsByIssueId(tenant: Tenant, issues_id: number) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(MaterialIssueItem);

        const queryBuilder = repository.createQueryBuilder('material_issue_items')
            .select([
                'material_issue_items.id AS id',
                'material_issue_items.quantity AS quantity',
                'material_issue_items.destinationReference AS destinationReference',
                'issues.id AS issues_id',
                'articles.id AS article_id',
                'articles.name AS article_name',
                'articles.sku AS article_sku',
                'articles.unit_measurement AS article_unit_measurement',
                'article_categories.name AS article_category_name',
                'article_brands.name AS article_brand_name'
            ])
            .innerJoin('material_issue_items.issue', 'issues')
            .innerJoin('material_issue_items.article', 'articles')
            .innerJoin('articles.category', 'article_categories')
            .innerJoin('articles.brand', 'article_brands')
            .where('material_issue_items.issue = :issues_id', { issues_id });

        const receipt = await queryBuilder.getRawMany();

        return receipt;
    }

    async update(tenant: Tenant, id: number, dto: UpdateMaterialIssueDto) {
        const issue = await this.findOne(tenant, id);

        if (issue.status !== MaterialIssueStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden editar salidas en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const issueRepo = connection.getRepository(MaterialIssue);

        if (dto.store_id) {
            issue.store = { id: dto.store_id } as any;
        }

        await issueRepo.save(issue);
        return this.findOne(tenant, id);
    }

    async submit(tenant: Tenant, id: number) {
        const issue = await this.findOne(tenant, id);

        if (issue.status !== MaterialIssueStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden enviar salidas en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const issueRepo = connection.getRepository(MaterialIssue);

        issue.status = MaterialIssueStatus.PENDING;
        await issueRepo.save(issue);

        return this.findOne(tenant, id);
    }

    async approve(tenant: Tenant, id: number, userId: string) {
        const issue = await this.findOne(tenant, id);

        if (issue.status !== MaterialIssueStatus.DRAFT && issue.status !== MaterialIssueStatus.PENDING) {
            throw new BadRequestException('Solo se pueden aprobar salidas en estado DRAFT o PENDING');
        }

        // VALIDAR STOCK ANTES DE APROBAR
        for (const item of issue.items) {
            const hasStock = await this.inventoryService.validateStock(
                tenant,
                item.article.id,
                issue.store.id,
                item.quantity
            );

            if (!hasStock) {
                const currentStock = await this.inventoryService.getStock(
                    tenant,
                    item.article.id,
                    issue.store.id
                );
                throw new BadRequestException(
                    `Stock insuficiente para artículo ${item.article.id}. ` +
                    `Disponible: ${currentStock}, Requerido: ${item.quantity}`
                );
            }
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const queryRunner = connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar estado de la salida
            issue.status = MaterialIssueStatus.APPROVED;
            issue.approvedBy = userId;
            await queryRunner.manager.save(issue);

            // Por cada item: crear Movement(OUT) y actualizar Inventory
            for (const item of issue.items) {
                // Crear movimiento
                await this.inventoryService.createMovement(
                    queryRunner,
                    tenant,
                    {
                        article_id: item.article.id,
                        store_id: issue.store.id,
                        type: MovementType.OUT,
                        quantity: item.quantity,
                        referenceType: 'MATERIAL_ISSUE',
                        reference_id: issue.id,
                        user_id: userId
                    }
                );

                // Actualizar inventario (resta)
                await this.inventoryService.updateStock(
                    queryRunner,
                    tenant,
                    item.article.id,
                    issue.store.id,
                    item.quantity,
                    'SUBTRACT'
                );
            }

            await queryRunner.commitTransaction();
            return this.findOne(tenant, id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async reject(tenant: Tenant, id: number, userId: string) {
        const issue = await this.findOne(tenant, id);

        if (issue.status !== MaterialIssueStatus.DRAFT && issue.status !== MaterialIssueStatus.PENDING) {
            throw new BadRequestException('Solo se pueden rechazar salidas en estado DRAFT o PENDING');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const issueRepo = connection.getRepository(MaterialIssue);

        issue.status = MaterialIssueStatus.REJECTED;
        issue.approvedBy = userId;

        await issueRepo.save(issue);
        return this.findOne(tenant, id);
    }

    async cancel(tenant: Tenant, id: number) {
        const issue = await this.findOne(tenant, id);

        if (issue.status === MaterialIssueStatus.APPROVED) {
            throw new BadRequestException('No se pueden cancelar salidas aprobadas');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const issueRepo = connection.getRepository(MaterialIssue);

        issue.status = MaterialIssueStatus.CANCELLED;
        await issueRepo.save(issue);

        return this.findOne(tenant, id);
    }


}
