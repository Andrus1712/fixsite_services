import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { StockTransfer, StockTransferStatus } from "src/entities/branch/stock-transfer.entity";
import { StockTransferItem } from "src/entities/branch/stock-transfer-item.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { InventoryService } from "../inventory-core/inventory.service";
import { CreateStockTransferDto } from "./dto/create-stock-transfer.dto";
import { UpdateStockTransferDto } from "./dto/update-stock-transfer.dto";
import { MovementType } from "src/entities/branch/movement.entity";

@Injectable()
export class StockTransferService {
    constructor(
        private readonly tenantService: ConnectionDatabaseService,
        private readonly inventoryService: InventoryService
    ) { }

    async create(tenant: Tenant, dto: CreateStockTransferDto, userId: string) {
        if (dto.fromStore_id === dto.toStore_id) {
            throw new BadRequestException('El almacén origen y destino no pueden ser el mismo');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const transferRepo = connection.getRepository(StockTransfer);
        const itemRepo = connection.getRepository(StockTransferItem);

        const transfer = transferRepo.create({
            fromStore: { id: dto.fromStore_id } as any,
            toStore: { id: dto.toStore_id } as any,
            status: StockTransferStatus.DRAFT,
            createdBy: userId,
            createdAt: new Date()
        });

        const savedTransfer = await transferRepo.save(transfer);

        const items = dto.items.map(item => itemRepo.create({
            transfer: savedTransfer,
            article: { id: item.article_id } as any,
            quantity: item.stock
        }));

        await itemRepo.save(items);

        return this.findOne(tenant, savedTransfer.id);
    }

    async findAll(tenant: Tenant, page: number, limit: number, filter?: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(StockTransfer);

        const queryBuilder = repository.createQueryBuilder('transfer')
            .leftJoinAndSelect('transfer.fromStore', 'fromStore')
            .leftJoinAndSelect('transfer.toStore', 'toStore')
            .leftJoinAndSelect('transfer.items', 'items')
            .leftJoinAndSelect('items.article', 'article');

        if (filter) {
            queryBuilder.where('fromStore.name LIKE :filter OR toStore.name LIKE :filter', {
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
        const repository = connection.getRepository(StockTransfer);

        const transfer = await repository.findOne({
            where: { id },
            relations: ['fromStore', 'toStore', 'items', 'items.article']
        });

        if (!transfer) {
            throw new NotFoundException('Transferencia no encontrada');
        }

        return transfer;
    }

    async findItemsByTransferId(tenant: Tenant, transfer_id: number) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(StockTransferItem);

        const queryBuilder = repository.createQueryBuilder('stock_transfer_items')
            .leftJoinAndSelect('stock_transfer_items.transfer', 'transfer')
            .leftJoinAndSelect('stock_transfer_items.article', 'articles')
            .leftJoinAndSelect('articles.category', 'article_categories')
            .leftJoinAndSelect('articles.brand', 'article_brands')
            .where('transfer.id = :transfer_id', { transfer_id })
            .select([
                'stock_transfer_items.id AS id',
                'stock_transfer_items.quantity AS quantity',
                'transfer.id AS transfer_id',
                'articles.id AS article_id',
                'articles.name AS article_name',
                'articles.sku AS article_sku',
                'articles.unit_measurement AS article_unit_measurement',
                'article_categories.name AS article_category_name',
                'article_brands.name AS article_brand_name'
            ]);

        return await queryBuilder.getRawMany();
    }

    async update(tenant: Tenant, id: number, dto: UpdateStockTransferDto) {
        const transfer = await this.findOne(tenant, id);

        if (transfer.status !== StockTransferStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden editar transferencias en estado DRAFT');
        }

        if (dto.fromStore_id && dto.toStore_id && dto.fromStore_id === dto.toStore_id) {
            throw new BadRequestException('El almacén origen y destino no pueden ser el mismo');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const transferRepo = connection.getRepository(StockTransfer);
        const itemRepo = connection.getRepository(StockTransferItem);

        if (dto.fromStore_id) {
            transfer.fromStore = { id: dto.fromStore_id } as any;
        }
        if (dto.toStore_id) {
            transfer.toStore = { id: dto.toStore_id } as any;
        }

        const savedTransfer = await transferRepo.save(transfer);

        if (dto.items) {
            await itemRepo.deleteAll();
            const items = dto.items.map(item => itemRepo.create({
                transfer: savedTransfer,
                article: { id: item.article_id } as any,
                quantity: item.stock
            }));
            await itemRepo.save(items);
        }

        return this.findOne(tenant, id);
    }

    async submit(tenant: Tenant, id: number) {
        const transfer = await this.findOne(tenant, id);

        if (transfer.status !== StockTransferStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden enviar transferencias en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const transferRepo = connection.getRepository(StockTransfer);

        transfer.status = StockTransferStatus.PENDING;
        await transferRepo.save(transfer);

        return this.findOne(tenant, id);
    }

    async approve(tenant: Tenant, id: number, userId: string) {
        const transfer = await this.findOne(tenant, id);

        if (transfer.status !== StockTransferStatus.DRAFT && transfer.status !== StockTransferStatus.PENDING) {
            throw new BadRequestException('Solo se pueden aprobar transferencias en estado DRAFT o PENDING');
        }

        // VALIDAR STOCK EN ALMACÉN ORIGEN
        for (const item of transfer.items) {
            const hasStock = await this.inventoryService.validateStock(
                tenant,
                item.article.id,
                transfer.fromStore.id,
                item.quantity
            );

            if (!hasStock) {
                const currentStock = await this.inventoryService.getStock(
                    tenant,
                    item.article.id,
                    transfer.fromStore.id
                );
                throw new BadRequestException(
                    `Stock insuficiente en almacén origen para artículo ${item.article.id}. ` +
                    `Disponible: ${currentStock}, Requerido: ${item.quantity}`
                );
            }
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const queryRunner = connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar estado
            transfer.status = StockTransferStatus.APPROVED;
            transfer.approvedBy = userId;
            await queryRunner.manager.save(transfer);

            // Por cada item: crear 2 movimientos (OUT + IN) y actualizar inventarios
            for (const item of transfer.items) {
                // Movimiento OUT del almacén origen
                await this.inventoryService.createMovement(
                    queryRunner,
                    tenant,
                    {
                        article_id: item.article.id,
                        store_id: transfer.fromStore.id,
                        type: MovementType.OUT,
                        quantity: item.quantity,
                        referenceType: 'STOCK_TRANSFER',
                        reference_id: transfer.id,
                        user_id: userId
                    }
                );

                // Actualizar inventario origen (resta)
                await this.inventoryService.updateStock(
                    queryRunner,
                    tenant,
                    item.article.id,
                    transfer.fromStore.id,
                    item.quantity,
                    'SUBTRACT'
                );

                // Movimiento IN al almacén destino
                await this.inventoryService.createMovement(
                    queryRunner,
                    tenant,
                    {
                        article_id: item.article.id,
                        store_id: transfer.toStore.id,
                        type: MovementType.IN,
                        quantity: item.quantity,
                        referenceType: 'STOCK_TRANSFER',
                        reference_id: transfer.id,
                        user_id: userId
                    }
                );

                // Actualizar inventario destino (suma)
                await this.inventoryService.updateStock(
                    queryRunner,
                    tenant,
                    item.article.id,
                    transfer.toStore.id,
                    item.quantity,
                    'ADD'
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
        const transfer = await this.findOne(tenant, id);

        if (transfer.status !== StockTransferStatus.DRAFT && transfer.status !== StockTransferStatus.PENDING) {
            throw new BadRequestException('Solo se pueden rechazar transferencias en estado DRAFT o PENDING');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const transferRepo = connection.getRepository(StockTransfer);

        transfer.status = StockTransferStatus.REJECTED;
        transfer.approvedBy = userId;

        await transferRepo.save(transfer);
        return this.findOne(tenant, id);
    }

    async cancel(tenant: Tenant, id: number) {
        const transfer = await this.findOne(tenant, id);

        if (transfer.status === StockTransferStatus.APPROVED) {
            throw new BadRequestException('No se pueden cancelar transferencias aprobadas');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const transferRepo = connection.getRepository(StockTransfer);

        transfer.status = StockTransferStatus.CANCELLED;
        await transferRepo.save(transfer);

        return this.findOne(tenant, id);
    }
}
