import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { PurchaseOrder, PurchaseOrderStatus } from "src/entities/branch/purchase-order.entity";
import { PurchaseOrderDetail } from "src/entities/branch/purchase-order-detail.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto";

@Injectable()
export class PurchaseOrderService {
    constructor(private readonly tenantService: ConnectionDatabaseService) { }

    async create(tenant: Tenant, dto: CreatePurchaseOrderDto) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const orderRepo = connection.getRepository(PurchaseOrder);
        const detailRepo = connection.getRepository(PurchaseOrderDetail);

        const order = orderRepo.create({
            provider_id: { id: dto.provider_id } as any,
            status: PurchaseOrderStatus.DRAFT,
            date: new Date(dto.date),
            created_at: new Date(),
            updated_at: new Date()
        });

        const savedOrder = await orderRepo.save(order);

        const details = dto.details.map(detail => detailRepo.create({
            purchase_order_id: savedOrder.id,
            purchaseOrder: savedOrder,
            article_id: detail.article_id,
            article: { id: detail.article_id } as any,
            quantity: detail.quantity,
            unitCost: detail.unitCost,
            created_at: new Date(),
            updated_at: new Date()
        }));

        await detailRepo.save(details);

        return this.findOne(tenant, savedOrder.id);
    }

    async findAll(tenant: Tenant, page: number, limit: number, filter?: string) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(PurchaseOrder);

        const queryBuilder = repository.createQueryBuilder('order')
            .leftJoinAndSelect('order.provider_id', 'provider')
            .leftJoinAndSelect('order.purchase_order_details', 'details')
            .leftJoinAndSelect('details.article', 'article');

        if (filter) {
            queryBuilder.where('provider.name LIKE :filter', { filter: `%${filter}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(tenant: Tenant, id: number) {
        const connection = await this.tenantService.getTenantConnection(tenant);
        const repository = connection.getRepository(PurchaseOrder);

        const order = await repository.findOne({
            where: { id },
            relations: ['provider_id', 'purchase_order_details', 'purchase_order_details.article']
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        return order;
    }

    async update(tenant: Tenant, id: number, dto: UpdatePurchaseOrderDto) {
        const order = await this.findOne(tenant, id);

        if (order.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden editar órdenes en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const orderRepo = connection.getRepository(PurchaseOrder);

        if (dto.provider_id) {
            order.provider_id = { id: dto.provider_id } as any;
        }
        if (dto.date) {
            order.date = new Date(dto.date);
        }
        order.updated_at = new Date();

        await orderRepo.save(order);
        return this.findOne(tenant, id);
    }

    async changeStatus(tenant: Tenant, id: number, status: PurchaseOrderStatus) {
        const order = await this.findOne(tenant, id);
        const connection = await this.tenantService.getTenantConnection(tenant);
        const orderRepo = connection.getRepository(PurchaseOrder);

        order.status = status;
        order.updated_at = new Date();

        await orderRepo.save(order);
        return this.findOne(tenant, id);
    }

    async delete(tenant: Tenant, id: number) {
        const order = await this.findOne(tenant, id);

        if (order.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden eliminar órdenes en estado DRAFT');
        }

        const connection = await this.tenantService.getTenantConnection(tenant);
        const orderRepo = connection.getRepository(PurchaseOrder);

        await orderRepo.delete(id);
        return order;
    }
}
