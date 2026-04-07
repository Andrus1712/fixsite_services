import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { Inventory } from "src/entities/branch/inventory.entity";
import { Movement, MovementType } from "src/entities/branch/movement.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { DataSource } from "typeorm";

@Injectable()
export class InventoryService {
    constructor(private readonly tenantService: ConnectionDatabaseService) { }

    /**
     * Actualiza el stock de inventario
     * @param queryRunner - QueryRunner para transacciones
     * @param tenant - Tenant actual
     * @param article_id - ID del artículo
     * @param store_id - ID del almacén
     * @param quantity - Cantidad a modificar (positivo o negativo)
     * @param operation - Tipo de operación: ADD (sumar), SUBTRACT (restar), SET (establecer)
     */
    async updateStock(
        queryRunner: any,
        tenant: Tenant,
        article_id: number,
        store_id: number,
        stock: number,
        operation: 'ADD' | 'SUBTRACT' | 'SET',
        min_stock: number = 0,
        max_stock: number = 1000
    ): Promise<Inventory> {
        const inventoryRepo = queryRunner.manager.getRepository(Inventory);

        let inventory = await inventoryRepo.findOne({
            where: { article_id, store_id }
        });

        if (!inventory) {
            // Crear nuevo registro si no existe
            inventory = inventoryRepo.create({
                article_id,
                store_id,
                stock: 0,
                min_stock,
                max_stock,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        // Aplicar operación
        switch (operation) {
            case 'ADD':
                inventory.stock += stock;
                break;
            case 'SUBTRACT':
                if (inventory.stock < stock) {
                    throw new BadRequestException(
                        `Stock insuficiente. Disponible: ${inventory.stock}, Requerido: ${stock}`
                    );
                }
                inventory.stock -= stock;
                break;
            case 'SET':
                inventory.stock = stock;
                break;
        }

        inventory.updated_at = new Date();
        return await inventoryRepo.save(inventory);
    }

    /**
     * Valida si hay stock disponible
     */
    async validateStock(
        tenant: Tenant,
        article_id: number,
        store_id: number,
        requiredStock: number
    ): Promise<boolean> {
        const repository = await this.tenantService.getRepository(Inventory, tenant);

        const inventory = await repository.findOne({
            where: { article_id, store_id }
        });

        if (!inventory) {
            return false;
        }

        return inventory.stock >= requiredStock;
    }

    /**
     * Obtiene el stock actual
     */
    async getStock(
        tenant: Tenant,
        article_id: number,
        store_id: number
    ): Promise<number> {
        const repository = await this.tenantService.getRepository(Inventory, tenant);

        const inventory = await repository.findOne({
            where: { article_id, store_id }
        });

        return inventory ? inventory.stock : 0;
    }

    /**
     * Crea un movimiento de inventario (inmutable)
     */
    async createMovement(
        queryRunner: any,
        tenant: Tenant,
        data: {
            article_id: number;
            store_id: number;
            type: MovementType;
            quantity: number;
            referenceType: string;
            reference_id: number;
            user_id: string;
        }
    ): Promise<Movement> {
        const movementRepo = queryRunner.manager.getRepository(Movement);

        const movement = movementRepo.create({
            ...data,
            created_at: new Date(),
            updated_at: new Date()
        });

        return await movementRepo.save(movement);
    }

    /**
     * Lista inventario con paginación
     */
    async getAllInventory(tenant: Tenant, page: number, limit: number, filter?: string) {
        const repository = await this.tenantService.getRepository(Inventory, tenant);

        const queryBuilder = repository.createQueryBuilder('inventory')
            .leftJoinAndSelect('inventory.article', 'article')
            .leftJoinAndSelect('inventory.store', 'store');

        if (filter) {
            queryBuilder.where('article.name LIKE :filter OR store.name LIKE :filter', {
                filter: `%${filter}%`
            });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Obtiene inventario por ID
     */
    async getInventoryById(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(Inventory, tenant);
        return await repository.findOne({
            where: { id },
            relations: ['article', 'store']
        });
    }

    /**
     * Actualiza el min y max stock del inventario
     * @param queryRunner - QueryRunner para transacciones
     * @param tenant - Tenant actual
     * @param article_id - ID del artículo
     * @param store_id - ID del almacén
     * @param min_stock - Stock minimo permitido
     * @param max_stock - Stock maximo permitido
     */
    async configMinMaxStock(
        queryRunner: any,
        tenant: Tenant,
        article_id: number,
        store_id: number,
        min_stock: number = 0,
        max_stock: number = 1000
    ): Promise<Inventory> {
        const inventoryRepo = queryRunner.manager.getRepository(Inventory);

        let inventory = await inventoryRepo.findOne({
            where: { article_id, store_id }
        });

        if (!inventory) {
            throw new NotFoundException('No existe inventario para este artículo y almacén');
        }

        inventory.updated_at = new Date();
        return await inventoryRepo.save({
            ...inventory,
            min_stock,
            max_stock
        });
    }
}
