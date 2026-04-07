import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { MaterialReceipt, MaterialReceiptStatus } from "src/entities/branch/material-receipts.entity";
import { MaterialReceiptItem } from "src/entities/branch/material-receipt-items.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { InventoryService } from "../inventory-core/inventory.service";
import { CreateMaterialReceiptDto } from "./dto/create-material-receipt.dto";
import { UpdateMaterialReceiptDto } from "./dto/update-material-receipt.dto";
import { MovementType } from "src/entities/branch/movement.entity";
import { RealtimeService } from "src/modules/realtime/realtime.service";

@Injectable()
export class MaterialReceiptService {
    constructor(
        private readonly tenantService: ConnectionDatabaseService,
        private readonly inventoryService: InventoryService,
        private readonly realtimeService: RealtimeService
    ) { }

    async create(tenant: Tenant, dto: CreateMaterialReceiptDto, userId: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const receiptRepo = connection.getRepository(MaterialReceipt);
        const itemRepo = connection.getRepository(MaterialReceiptItem);

        const receipt = receiptRepo.create({
            store: { id: dto.store_id } as any,
            purchaseOrder: dto.purchaseOrder_id ? { id: dto.purchaseOrder_id } as any : null,
            status: MaterialReceiptStatus.DRAFT,
            createdBy: userId,
            createdAt: new Date()
        });

        const savedReceipt = await receiptRepo.save(receipt);

        // Crear items
        const items = dto.items.map(item => itemRepo.create({
            receipt: savedReceipt,
            article: { id: item.article_id } as any,
            quantity: item.quantity,
            unitCost: item.unitCost
        }));

        await itemRepo.save(items);

        return this.findOne(tenant, savedReceipt.id);
    }

    async findAll(tenant: Tenant, page: number, limit: number, filter?: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(MaterialReceipt);

        const queryBuilder = repository.createQueryBuilder('receipt')
            .leftJoinAndSelect('receipt.store', 'store')
            .leftJoinAndSelect('receipt.items', 'items')
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
        const repository = connection.getRepository(MaterialReceipt);

        const receipt = await repository.findOne({
            where: { id },
            relations: ['store', 'items', 'items.article', 'purchaseOrder']
        });

        if (!receipt) {
            throw new NotFoundException('Recepción de material no encontrada');
        }

        return receipt;
    }

    async findItemsByReceiptId(tenant: Tenant, receipt_id: number) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(MaterialReceiptItem);

        const queryBuilder = repository.createQueryBuilder('material_receipt_items')
            .leftJoinAndSelect('material_receipt_items.receipt', 'material_receipt')
            .leftJoinAndSelect('material_receipt_items.article', 'articles')
            .leftJoinAndSelect('articles.category', 'article_categories')
            .leftJoinAndSelect('articles.brand', 'article_brands')
            .where('material_receipt.id = :receipt_id', { receipt_id })
            .select([
                'material_receipt_items.id AS id',
                'material_receipt_items.quantity AS quantity',
                'material_receipt_items.unitCost AS unitCost',
                'material_receipt.id AS receipt_id',
                'articles.id AS article_id',
                'articles.name AS article_name',
                'articles.sku AS article_sku',
                'articles.unit_measurement AS article_unit_measurement',
                'article_categories.name AS article_category_name',
                'article_brands.name AS article_brand_name'
            ]);

        return await queryBuilder.getRawMany();
    }

    async update(tenant: Tenant, id: number, dto: UpdateMaterialReceiptDto) {
        const receipt = await this.findOne(tenant, id);

        if (receipt.status !== MaterialReceiptStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden editar recepciones en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const receiptRepo = connection.getRepository(MaterialReceipt);

        if (dto.store_id) {
            receipt.store = { id: dto.store_id } as any;
        }

        await receiptRepo.save(receipt);
        return this.findOne(tenant, id);
    }

    async submit(tenant: Tenant, id: number) {
        const receipt = await this.findOne(tenant, id);

        if (receipt.status !== MaterialReceiptStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden enviar recepciones en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const receiptRepo = connection.getRepository(MaterialReceipt);

        receipt.status = MaterialReceiptStatus.PENDING;
        await receiptRepo.save(receipt);

        return this.findOne(tenant, id);
    }

    async approve(tenant: Tenant, id: number, userId: string) {
        const receipt = await this.findOne(tenant, id);

        if (receipt.status !== MaterialReceiptStatus.DRAFT && receipt.status !== MaterialReceiptStatus.PENDING) {
            throw new BadRequestException('Solo se pueden aprobar recepciones en estado DRAFT o PENDING');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const queryRunner = connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar estado de la recepción
            receipt.status = MaterialReceiptStatus.APPROVED;
            receipt.approvedBy = userId;
            await queryRunner.manager.save(receipt);

            // Por cada item: crear Movement(IN) y actualizar Inventory
            for (const item of receipt.items) {
                // Crear movimiento
                await this.inventoryService.createMovement(
                    queryRunner,
                    tenant,
                    {
                        article_id: item.article.id,
                        store_id: receipt.store.id,
                        type: MovementType.IN,
                        quantity: item.quantity,
                        referenceType: 'MATERIAL_RECEIPT',
                        reference_id: receipt.id,
                        user_id: userId
                    }
                );

                // Actualizar inventario
                await this.inventoryService.updateStock(
                    queryRunner,
                    tenant,
                    item.article.id,
                    receipt.store.id,
                    item.quantity,
                    'ADD'
                );
            }

            await queryRunner.commitTransaction();
            // Por ultimo, emitir actualización de stats y notificación
            await this.realtimeService.emitStats(tenant.id);
            // this.realtimeService.sendNotification(tenant.id, {
            //     id: uuid(),
            //     userId: userId,        // o undefined para broadcast al tenant
            //     type: 'RECEIPT_APPROVED',
            //     title: 'Recepción aprobada',
            //     body: `Recepción #${id} fue aprobada`,
            //     createdAt: new Date().toISOString(),
            // });
            return this.findOne(tenant, id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async reject(tenant: Tenant, id: number, userId: string) {
        const receipt = await this.findOne(tenant, id);

        if (receipt.status !== MaterialReceiptStatus.DRAFT && receipt.status !== MaterialReceiptStatus.PENDING) {
            throw new BadRequestException('Solo se pueden rechazar recepciones en estado DRAFT o PENDING');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const receiptRepo = connection.getRepository(MaterialReceipt);

        receipt.status = MaterialReceiptStatus.REJECTED;
        receipt.approvedBy = userId;

        await receiptRepo.save(receipt);
        return this.findOne(tenant, id);
    }

    async cancel(tenant: Tenant, id: number) {
        const receipt = await this.findOne(tenant, id);

        if (receipt.status === MaterialReceiptStatus.APPROVED) {
            throw new BadRequestException('No se pueden cancelar recepciones aprobadas');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const receiptRepo = connection.getRepository(MaterialReceipt);

        receipt.status = MaterialReceiptStatus.CANCELLED;
        await receiptRepo.save(receipt);

        return this.findOne(tenant, id);
    }

    async testSocket(tenant: Tenant) {
        await this.realtimeService.emitStatsTest(tenant.id, { message: 'Socket test successful' });
    }
}
