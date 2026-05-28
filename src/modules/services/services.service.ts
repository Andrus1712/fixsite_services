import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Tenant } from 'src/entities/global/tenant.entity';
import { Service } from '../../entities/branch/service.entity';
import { OrderType } from '../../entities/branch/order-type.entity';
import { ServiceOrderType } from '../../entities/branch/service-order-type.entity';
import { OrderService } from '../../entities/branch/order-service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateOrderTypeDto } from './dto/create-order-type.dto';
import { UpdateOrderTypeDto } from './dto/update-order-type.dto';
import { CreateServiceOrderTypeDto } from './dto/create-service-order-type.dto';
import { UpdateServiceOrderTypeDto } from './dto/update-service-order-type.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly tenantAwareService: ConnectionDatabaseService) { }

  // ── Services ──────────────────────────────────────────────────────────────

  async getAllServices(tenant: Tenant, page = 1, limit = 10, filter?: string) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    const qb = repo.createQueryBuilder('service');

    if (filter) {
      qb.where('service.code LIKE :f OR service.description LIKE :f', { f: `%${filter}%` });
    }

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllServices(tenant: Tenant) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    const [data, total] = await repo.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneService(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    const service = await repo.findOne({ where: { id } });
    if (!service) throw new NotFoundException(`Service with ID ${id} not found`);
    return service;
  }

  async createService(tenant: Tenant, dto: CreateServiceDto) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    try {
      return await repo.save(repo.create(dto));
    } catch (error) {
      if (error?.code === '23505') {
        throw new ConflictException(`Ya existe un servicio con el código '${dto.code}'`);
      }
      throw error;
    }
  }

  async updateService(tenant: Tenant, id: number, dto: UpdateServiceDto) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    await repo.update(id, dto);
    return repo.findOne({ where: { id } });
  }

  async removeService(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    await repo.delete(id);
  }

  // ── Order Types ───────────────────────────────────────────────────────────

  async getAllOrderTypes(tenant: Tenant, page = 1, limit = 10, filter?: string) {
    const repo = await this.tenantAwareService.getRepository(OrderType, tenant);
    const qb = repo.createQueryBuilder('orderType');

    if (filter) {
      qb.where('orderType.codigo LIKE :f OR orderType.nombre LIKE :f', { f: `%${filter}%` });
    }

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllOrderTypes(tenant: Tenant) {
    const repo = await this.tenantAwareService.getRepository(OrderType, tenant);
    const [data, total] = await repo.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneOrderType(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(OrderType, tenant);
    const orderType = await repo.findOne({ where: { id } });
    if (!orderType) throw new NotFoundException(`OrderType with ID ${id} not found`);
    return orderType;
  }

  async createOrderType(tenant: Tenant, dto: CreateOrderTypeDto) {
    const repo = await this.tenantAwareService.getRepository(OrderType, tenant);
    try {
      return await repo.save(repo.create(dto));
    } catch (error) {
      if (error?.code === '23505') {
        throw new ConflictException(`Ya existe un tipo de orden con ese código`);
      }
      throw error;
    }
  }

  async updateOrderType(tenant: Tenant, id: number, dto: UpdateOrderTypeDto) {
    const repo = await this.tenantAwareService.getRepository(OrderType, tenant);
    await repo.update(id, dto);
    return repo.findOne({ where: { id } });
  }

  async removeOrderType(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(OrderType, tenant);
    await repo.delete(id);
  }

  // ── Service Order Types (catálogo de precios) ─────────────────────────────

  async getAllServiceOrderTypes(
    tenant: Tenant,
    page = 1,
    limit = 10,
    serviceId?: number,
    orderTypeId?: number,
  ) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    const qb = repo.createQueryBuilder('sot')
      .leftJoinAndSelect('sot.service', 'service')
      .leftJoinAndSelect('sot.orderType', 'orderType')
      .leftJoinAndSelect('sot.failureCode', 'failureCode');

    if (serviceId) qb.andWhere('sot.service_id = :serviceId', { serviceId });
    if (orderTypeId) qb.andWhere('sot.order_type_id = :orderTypeId', { orderTypeId });

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneServiceOrderType(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    return repo.findOne({ where: { id }, relations: ['service', 'orderType', 'failureCode'] });
  }

  async createServiceOrderType(tenant: Tenant, dto: CreateServiceOrderTypeDto) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    const entity = repo.create({
      service: { id: dto.service_id } as any,
      orderType: { id: dto.order_type_id } as any,
      failureCode: dto.failure_code_id ? ({ id: dto.failure_code_id } as any) : null,
      price: dto.price,
      estimatedMinutes: dto.estimated_minutes,
      is_active: dto.is_active ?? true,
    });
    return repo.save(entity);
  }

  async updateServiceOrderType(tenant: Tenant, id: number, dto: UpdateServiceOrderTypeDto) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    const update: any = { ...dto };
    if (dto.service_id !== undefined) { update.service = { id: dto.service_id }; delete update.service_id; }
    if (dto.order_type_id !== undefined) { update.orderType = { id: dto.order_type_id }; delete update.order_type_id; }
    if (dto.failure_code_id !== undefined) { update.failureCode = { id: dto.failure_code_id }; delete update.failure_code_id; }
    await repo.save({ id, ...update });
    return this.findOneServiceOrderType(tenant, id);
  }

  async removeServiceOrderType(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    await repo.delete(id);
  }

  // ── Available Services by OrderType + FailureCodes ────────────────────────

  /**
   * Devuelve los servicios disponibles para una orden según su tipo y las fallas
   * pendientes (no cubiertas aún por un OrderService existente).
   *
   * @param orderTypeId  - Tipo de orden
   * @param orderIssueIds - IDs de OrderIssue pendientes (fallas reportadas)
   * @param orderId      - ID de la orden (para excluir servicios ya asignados)
   */
  async findAvailableServices(
    tenant: Tenant,
    orderTypeId: number,
    orderIssueIds: number[],
    orderId?: number,
  ) {
    const connection = await this.tenantAwareService.getConnection(tenant);
    const sotRepo = connection.getRepository(ServiceOrderType);
    const orderServiceRepo = connection.getRepository(OrderService);

    // Resolver los failure_code_id a partir de los IDs de OrderIssue
    let failureCodeIds: number[] = [];

    if (orderIssueIds?.length) {
      const rows: { failure_code_id: number }[] = await connection
        .getRepository('order_issues')
        .createQueryBuilder('oi')
        .select('oi.failure_code_id', 'failure_code_id')
        .where('oi.id IN (:...orderIssueIds)', { orderIssueIds })
        .andWhere('oi.failure_code_id IS NOT NULL')
        .distinct(true)
        .getRawMany();

      failureCodeIds = rows.map(r => r.failure_code_id).filter(id => id != null);
    }

    const qb = sotRepo.createQueryBuilder('sot')
      .leftJoinAndSelect('sot.service', 'service')
      .leftJoinAndSelect('sot.orderType', 'orderType')
      .leftJoinAndSelect('sot.failureCode', 'failureCode')
      .where('sot.order_type_id = :orderTypeId', { orderTypeId })
      .andWhere('sot.is_active = true')
      .andWhere('service.is_active = true');

    if (failureCodeIds.length) {
      qb.andWhere('sot.failure_code_id IN (:...failureCodeIds)', { failureCodeIds });
    } else {
      qb.andWhere('sot.failure_code_id IS NULL');
    }

    if (orderId) {
      const subQuery = orderServiceRepo
        .createQueryBuilder('os')
        .select('os.service_id')
        .where('os.order_id = :orderId', { orderId });

      qb.andWhere(`sot.service_id NOT IN (${subQuery.getQuery()})`)
        .setParameter('orderId', orderId);
    }

    return qb.orderBy('service.description', 'ASC').getMany();
  }
}
