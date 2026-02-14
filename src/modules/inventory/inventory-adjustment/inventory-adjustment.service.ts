import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { InventoryAdjustment, InventoryAdjustmentStatus } from "src/entities/branch/inventory-adjustment.entity";
import { InventoryAdjustmentItem } from "src/entities/branch/inventory-adjustment-item.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { InventoryService } from "../inventory-core/inventory.service";
import { CreateInventoryAdjustmentDto } from "./dto/create-inventory-adjustment.dto";
import { UpdateInventoryAdjustmentDto } from "./dto/update-inventory-adjustment.dto";
import { MovementType } from "src/entities/branch/movement.entity";

@Injectable()
export class InventoryAdjustmentService {
    constructor(
        private readonly tenantService: ConnectionDatabaseService,
        private readonly inventoryService: InventoryService
    ) { }

    async create(tenant: Tenant, dto: CreateInventoryAdjustmentDto, userId: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const adjustmentRepo = connection.getRepository(InventoryAdjustment);
        const itemRepo = connection.getRepository(InventoryAdjustmentItem);

        const adjustment = adjustmentRepo.create({
            store: { id: dto.store_id } as any,
            reason: dto.reason,
            status: InventoryAdjustmentStatus.DRAFT,
            createdBy: userId,
            createdAt: new Date()
        });

        const savedAdjustment = await adjustmentRepo.save(adjustment);

        const items = dto.items.map(item => {
            const difference = item.newQuantity - item.currentQuantity;
            return itemRepo.create({
                adjustment: savedAdjustment,
                article: { id: item.article_id } as any,
                currentQuantity: item.currentQuantity,
                newQuantity: item.newQuantity,
                difference: difference
            });
        });

        await itemRepo.save(items);

        return this.findOne(tenant, savedAdjustment.id);
    }

    async findAll(tenant: Tenant, page: number, limit: number, filter?: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(InventoryAdjustment);

        const queryBuilder = repository.createQueryBuilder('adjustment')
            .leftJoinAndSelect('adjustment.store', 'store')
            .leftJoinAndSelect('adjustment.items', 'items')
            .leftJoinAndSelect('items.article', 'article');

        if (filter) {
            queryBuilder.where('store.name LIKE :filter OR adjustment.reason LIKE :filter', {
                filter: `%${filter}%`
            });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(tenant: Tenant, id: number) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(InventoryAdjustment);

        const adjustment = await repository.findOne({
            where: { id },
            relations: ['store', 'items', 'items.article']
        });

        if (!adjustment) {
            throw new NotFoundException('Ajuste de inventario no encontrado');
        }

        return adjustment;
    }

    async findItemsByAdjustmentId(tenant: Tenant, adjustment_id: number) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(InventoryAdjustmentItem);

        const queryBuilder = repository.createQueryBuilder('inventory_adjustment_items')
            .leftJoinAndSelect('inventory_adjustment_items.adjustment', 'adjustment')
            .leftJoinAndSelect('inventory_adjustment_items.article', 'articles')
            .leftJoinAndSelect('articles.category', 'article_categories')
            .leftJoinAndSelect('articles.brand', 'article_brands')
            .where('adjustment.id = :adjustment_id', { adjustment_id })
            .select([
                'inventory_adjustment_items.id AS id',
                'inventory_adjustment_items.currentQuantity AS currentQuantity',
                'inventory_adjustment_items.newQuantity AS newQuantity',
                'inventory_adjustment_items.difference AS difference',
                'adjustment.id AS adjustment_id',
                'articles.id AS article_id',
                'articles.name AS article_name',
                'articles.sku AS article_sku',
                'articles.unit_measurement AS article_unit_measurement',
                'article_categories.name AS article_category_name',
                'article_brands.name AS article_brand_name'
            ]);

        return await queryBuilder.getRawMany();
    }


    async update(tenant: Tenant, id: number, dto: UpdateInventoryAdjustmentDto) {
        const adjustment = await this.findOne(tenant, id);

        if (adjustment.status !== InventoryAdjustmentStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden editar ajustes en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const adjustmentRepo = connection.getRepository(InventoryAdjustment);

        if (dto.store_id) {
            adjustment.store = { id: dto.store_id } as any;
        }
        if (dto.reason) {
            adjustment.reason = dto.reason;
        }

        await adjustmentRepo.save(adjustment);
        return this.findOne(tenant, id);
    }

    async submit(tenant: Tenant, id: number) {
        const adjustment = await this.findOne(tenant, id);

        if (adjustment.status !== InventoryAdjustmentStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden enviar ajustes en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const adjustmentRepo = connection.getRepository(InventoryAdjustment);

        adjustment.status = InventoryAdjustmentStatus.PENDING;
        await adjustmentRepo.save(adjustment);

        return this.findOne(tenant, id);
    }

    async approve(tenant: Tenant, id: number, userId: string) {
        const adjustment = await this.findOne(tenant, id);

        if (adjustment.status !== InventoryAdjustmentStatus.DRAFT &&
            adjustment.status !== InventoryAdjustmentStatus.PENDING) {
            throw new BadRequestException('Solo se pueden aprobar ajustes en estado DRAFT o PENDING');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const queryRunner = connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar estado
            adjustment.status = InventoryAdjustmentStatus.APPROVED;
            adjustment.approvedBy = userId;
            await queryRunner.manager.save(adjustment);

            // Por cada item: crear Movement según diferencia y actualizar inventario
            for (const item of adjustment.items) {
                if (item.difference > 0) {
                    // Diferencia positiva: crear Movement IN
                    await this.inventoryService.createMovement(
                        queryRunner,
                        tenant,
                        {
                            article_id: item.article.id,
                            store_id: adjustment.store.id,
                            type: MovementType.IN,
                            quantity: Math.abs(item.difference),
                            referenceType: 'INVENTORY_ADJUSTMENT',
                            reference_id: adjustment.id,
                            user_id: userId
                        }
                    );
                } else if (item.difference < 0) {
                    // Diferencia negativa: crear Movement OUT
                    await this.inventoryService.createMovement(
                        queryRunner,
                        tenant,
                        {
                            article_id: item.article.id,
                            store_id: adjustment.store.id,
                            type: MovementType.OUT,
                            quantity: Math.abs(item.difference),
                            referenceType: 'INVENTORY_ADJUSTMENT',
                            reference_id: adjustment.id,
                            user_id: userId
                        }
                    );
                }

                // Actualizar inventario con la nueva cantidad (SET)
                await this.inventoryService.updateStock(
                    queryRunner,
                    tenant,
                    item.article.id,
                    adjustment.store.id,
                    item.newQuantity,
                    'SET'
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
        const adjustment = await this.findOne(tenant, id);

        if (adjustment.status !== InventoryAdjustmentStatus.DRAFT &&
            adjustment.status !== InventoryAdjustmentStatus.PENDING) {
            throw new BadRequestException('Solo se pueden rechazar ajustes en estado DRAFT o PENDING');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const adjustmentRepo = connection.getRepository(InventoryAdjustment);

        adjustment.status = InventoryAdjustmentStatus.REJECTED;
        adjustment.approvedBy = userId;

        await adjustmentRepo.save(adjustment);
        return this.findOne(tenant, id);
    }
}
