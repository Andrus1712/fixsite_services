import { Injectable, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { Store } from "src/entities/branch/store.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { Inventory } from "src/entities/branch";
import { MaterialReceiptService } from "../material-receipt/material-receipt.service";
import { InventoryAdjustmentService } from "../inventory-adjustment/inventory-adjustment.service";
import { StockTransferService } from "../stock-transfer/stock-transfer.service";
import { MaterialIssueService } from "../material-issue/material-issue.service";

@Injectable()
export class StoreService {
    constructor(
        private readonly tenantService: ConnectionDatabaseService,
        private readonly materialReceipsService: MaterialReceiptService,
        private readonly materialIssueService: MaterialIssueService,
        private readonly inventoryAdjustmentService: InventoryAdjustmentService,
        private readonly stockTransferService: StockTransferService,
    ) { }

    async getAllStores(tenant: Tenant, page: number, limit: number, filter?: string) {
        const repository = await this.tenantService.getRepository(Store, tenant);

        const queryBuilder = repository.createQueryBuilder('stores');
        if (filter) {
            queryBuilder.where('stores.name LIKE :filter OR stores.type LIKE :filter', { filter: `%${filter}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getStoreById(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(Store, tenant);
        return await repository.findOne({ where: { id } });
    }

    async createStore(tenant: Tenant, createStoreDto: CreateStoreDto) {
        const repository = await this.tenantService.getRepository(Store, tenant);
        const entity = repository.create(createStoreDto);
        return repository.save(entity);
    }

    async updateStore(tenant: Tenant, id: number, updateStoreDto: UpdateStoreDto) {
        const repository = await this.tenantService.getRepository(Store, tenant);
        await repository.update(id, updateStoreDto);
        return this.getStoreById(tenant, id);
    }

    async deleteStore(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(Store, tenant);
        const store = await this.getStoreById(tenant, id);
        if (!store) {
            throw new Error('Almacén no encontrado');
        }
        await repository.delete(id);
        return store;
    }

    async getStoreInventory(tenant: Tenant, page: number, limit: number, filter?: string, id?: number) {
        const repository = await this.tenantService.getRepository(Inventory, tenant);

        const queryBuilder = repository.createQueryBuilder('inventory')
            .innerJoinAndSelect('inventory.store', 'stores')
            .innerJoinAndSelect('inventory.article', 'articles')
            .innerJoinAndSelect('articles.category', 'article_categories')
            .innerJoinAndSelect('articles.brand', 'article_brands');

        if (filter) {
            queryBuilder.andWhere(`
                (
                    stores.name LIKE :filter OR
                    stores.type LIKE :filter OR
                    articles.name LIKE :filter OR
                    articles.sku LIKE :filter OR
                    articles.description LIKE :filter OR
                    article_categories.name LIKE :filter OR
                    article_brands.name LIKE :filter
                )
            `, { filter: `%${filter}%` });
        }

        if (id) {
            queryBuilder.andWhere('stores.id = :id', { id });
        }

        queryBuilder.select([
            'inventory.id',
            'inventory.stock',
            'inventory.min_stock',
            'inventory.max_stock',
            'inventory.created_at',
            'inventory.updated_at',
            'stores.id',
            'stores.name',
            'stores.type',
            'articles.id',
            'articles.name',
            'articles.sku',
            'articles.unit_measurement',
            'articles.description',
            'article_categories.name',
            'article_brands.name'
        ]);

        const data = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getRawMany();
        const total = await queryBuilder.getCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async configMinMaxStock(tenant: Tenant, inventory_id: number,
        {
            max_stock,
            min_stock,
            alert_enabled
        }: { inventory_id: string; max_stock: number; min_stock: number; alert_enabled: boolean; }) {
        const repository = await this.tenantService.getRepository(Inventory, tenant);

        let inventory = await repository.findOne({
            where: { id: inventory_id }
        });

        if (!inventory) {
            throw new NotFoundException('No existe inventario para este artículo y almacén');
        }

        inventory.min_stock = min_stock;
        inventory.max_stock = max_stock;
        // inventory.alert_enabled = alert_enabled;
        inventory.updated_at = new Date();
        await repository.save(inventory);

        return inventory;
    }

    async getAllRequestInventoryByStoreId(
        tenant: Tenant,
        storeId: number,
        page: number,
        limit: number,
        filter?: string,
        statuses?: string[]
    ) {
        const connection = await this.tenantService.getTenantConnection(tenant);

        const store = await this.getStoreById(tenant, storeId);

        if (!store) {
            throw new NotFoundException('Almacén no encontrado');
        }

        // Construir queries SQL manualmente
        const receiptsQuery = `
            SELECT 
                mr.id as id_request,
                mr.status::text as status,
                CONCAT('MR-', mr.id) as code,
                'MATERIAL_RECEIPT' as reference,
                NULL as store_from_id,
                NULL as store_from_name,
                store.id as store_to_id,
                store.name as store_to_name,
                mr."createdBy" as created_by,
                mr."createdAt" as created_at,
                COUNT(items.id) as count_items,
                NULL as reason
            FROM material_receipts mr
            LEFT JOIN stores store ON mr."storeId" = store.id
            LEFT JOIN material_receipt_items items ON items."receiptId" = mr.id
            WHERE store.id = $1
            GROUP BY mr.id, mr.status, mr."createdBy", mr."createdAt", store.id, store.name
        `;

        const issuesQuery = `
            SELECT 
                mi.id as id_request,
                mi.status::text as status,
                CONCAT('MI-', mi.id) as code,
                'MATERIAL_ISSUE' as reference,
                store.id as store_from_id,
                store.name as store_from_name,
                NULL as store_to_id,
                NULL as store_to_name,
                mi."createdBy" as created_by,
                mi."createdAt" as created_at,
                COUNT(items.id) as count_items,
                NULL as reason
            FROM material_issues mi
            LEFT JOIN stores store ON mi."storeId" = store.id
            LEFT JOIN material_issue_items items ON items."issueId" = mi.id
            WHERE store.id = $2
            GROUP BY mi.id, mi.status, mi."createdBy", mi."createdAt", store.id, store.name
        `;

        const transfersQuery = `
            SELECT 
                st.id as id_request,
                st.status::text as status,
                CONCAT('ST-', st.id) as code,
                'STOCK_TRANSFER' as reference,
                "fromStore".id as store_from_id,
                "fromStore".name as store_from_name,
                "toStore".id as store_to_id,
                "toStore".name as store_to_name,
                st."createdBy" as created_by,
                st."createdAt" as created_at,
                COUNT(items.id) as count_items,
                NULL as reason
            FROM stock_transfers st
            LEFT JOIN stores "fromStore" ON st."fromStoreId" = "fromStore".id
            LEFT JOIN stores "toStore" ON st."toStoreId" = "toStore".id
            LEFT JOIN stock_transfer_items items ON items."transferId" = st.id
            WHERE "fromStore".id = $3 OR "toStore".id = $4
            GROUP BY st.id, st.status, st."createdBy", st."createdAt", "fromStore".id, "fromStore".name, "toStore".id, "toStore".name
        `;

        const adjustmentsQuery = `
            SELECT 
                ia.id as id_request,
                ia.status::text as status,
                CONCAT('IA-', ia.id) as code,
                'INVENTORY_ADJUSTMENT' as reference,
                NULL as store_from_id,
                NULL as store_from_name,
                store.id as store_to_id,
                store.name as store_to_name,
                ia."createdBy" as created_by,
                ia."createdAt" as created_at,
                COUNT(items.id) as count_items,
                ia.reason as reason
            FROM inventory_adjustments ia
            LEFT JOIN stores store ON ia."storeId" = store.id
            LEFT JOIN inventory_adjustment_items items ON items."adjustmentId" = ia.id
            WHERE store.id = $5
            GROUP BY ia.id, ia.status, ia."createdBy", ia."createdAt", ia.reason, store.id, store.name
        `;

        // Combinar todas las consultas con UNION ALL
        let unionQuery = `
            (${receiptsQuery})
            UNION ALL
            (${issuesQuery})
            UNION ALL
            (${transfersQuery})
            UNION ALL
            (${adjustmentsQuery})
        `;

        // Aplicar filtros
        let finalQuery = `SELECT * FROM (${unionQuery}) as combined`;
        let queryParams: any[] = [storeId, storeId, storeId, storeId, storeId];
        let paramIndex = 6;
        const whereConditions: string[] = [];

        if (statuses && statuses.length > 0) {
            const statusPlaceholders = statuses.map((_, idx) => `$${paramIndex + idx}`).join(', ');
            whereConditions.push(`status IN (${statusPlaceholders})`);
            queryParams.push(...statuses);
            paramIndex += statuses.length;
        }

        if (filter) {
            const filterConditions = `(
                status LIKE $${paramIndex} OR 
                reference LIKE $${paramIndex + 1} OR 
                store_from_name LIKE $${paramIndex + 2} OR 
                store_to_name LIKE $${paramIndex + 3} OR
                created_by LIKE $${paramIndex + 4} OR
                reason LIKE $${paramIndex + 5}
            )`;
            whereConditions.push(filterConditions);
            const filterParam = `%${filter}%`;
            queryParams.push(filterParam, filterParam, filterParam, filterParam, filterParam, filterParam);
            paramIndex += 6;
        }

        if (whereConditions.length > 0) {
            finalQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        // Ordenar por fecha de creación descendente
        finalQuery += ` ORDER BY created_at DESC`;

        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM (${finalQuery}) as counted`;
        const totalResult = await connection.query(countQuery, queryParams);
        const total = parseInt(totalResult[0].total);

        // Aplicar paginación
        finalQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, (page - 1) * limit);

        const data = await connection.query(finalQuery, queryParams);

        // Obtener items para cada solicitud
        for (const request of data) {
            let items: any[] = [];

            switch (request.reference) {
                case 'MATERIAL_RECEIPT':
                    items = await this.materialReceipsService.findItemsByReceiptId(tenant, request.id_request);
                    break;

                case 'MATERIAL_ISSUE':
                    items = await this.materialIssueService.findItemsByIssueId(tenant, request.id_request);
                    break;

                case 'STOCK_TRANSFER':
                    items = await this.stockTransferService.findItemsByTransferId(tenant, request.id_request);
                    break;

                case 'INVENTORY_ADJUSTMENT':
                    items = await this.inventoryAdjustmentService.findItemsByAdjustmentId(tenant, request.id_request);
                    break;
            }

            request.items = items;
        }

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

}
