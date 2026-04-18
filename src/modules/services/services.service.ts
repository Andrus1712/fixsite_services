import { Injectable } from '@nestjs/common';
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
  constructor(private readonly tenantAwareService: ConnectionDatabaseService) {}

  // ── Services ──────────────────────────────────────────────────────────────

  async getAllServices(tenant: Tenant, page = 1, limit = 10, filter?: string) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    const qb = repo.createQueryBuilder('service');

    if (filter) {
      qb.where('service.codigo LIKE :f OR service.descripcion LIKE :f', { f: `%${filter}%` });
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
    return repo.findOne({ where: { id } });
  }

  async createService(tenant: Tenant, dto: CreateServiceDto) {
    const repo = await this.tenantAwareService.getRepository(Service, tenant);
    return repo.save(repo.create(dto));
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
    return repo.findOne({ where: { id } });
  }

  async createOrderType(tenant: Tenant, dto: CreateOrderTypeDto) {
    const repo = await this.tenantAwareService.getRepository(OrderType, tenant);
    return repo.save(repo.create(dto));
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

  // ── Service Order Types ───────────────────────────────────────────────────

  async getAllServiceOrderTypes(tenant: Tenant, page = 1, limit = 10, serviceId?: number, orderTypeId?: number) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    const qb = repo.createQueryBuilder('sot')
      .leftJoinAndSelect('sot.service', 'service')
      .leftJoinAndSelect('sot.orderType', 'orderType')
      .leftJoinAndSelect('sot.issue', 'issue');

    if (serviceId) qb.andWhere('sot.service_id = :serviceId', { serviceId });
    if (orderTypeId) qb.andWhere('sot.order_type_id = :orderTypeId', { orderTypeId });

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneServiceOrderType(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    return repo.findOne({ where: { id }, relations: ['service', 'orderType', 'issue'] });
  }

  async createServiceOrderType(tenant: Tenant, dto: CreateServiceOrderTypeDto) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    const entity = repo.create({
      service: { id: dto.serviceId } as any,
      orderType: { id: dto.orderTypeId } as any,
      issue: dto.issueId ? ({ id: dto.issueId } as any) : null,
      precio: dto.precio,
      tiempoEstimadoMinutos: dto.tiempoEstimadoMinutos,
      activo: dto.activo ?? true,
    });
    return repo.save(entity);
  }

  async updateServiceOrderType(tenant: Tenant, id: number, dto: UpdateServiceOrderTypeDto) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    const update: any = { ...dto };
    if (dto.serviceId) { update.service = { id: dto.serviceId }; delete update.serviceId; }
    if (dto.orderTypeId) { update.orderType = { id: dto.orderTypeId }; delete update.orderTypeId; }
    if (dto.issueId) { update.issue = { id: dto.issueId }; delete update.issueId; }
    await repo.save({ id, ...update });
    return this.findOneServiceOrderType(tenant, id);
  }

  async removeServiceOrderType(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(ServiceOrderType, tenant);
    await repo.delete(id);
  }

  // ── Available Services by OrderType + Issues ──────────────────────────────

  async findAvailableServices(
    tenant: Tenant,
    orderTypeId: number,
    orderServiceIds: number[], // IDs de orders_service (no de orders_issues)
    orderId?: number,
  ) {
    const connection = await this.tenantAwareService.getConnection(tenant);
    const sotRepo = connection.getRepository(ServiceOrderType);
    const orderServiceRepo = connection.getRepository(OrderService);

    // Resolver los failure_code IDs a partir de los IDs de orders_service
    // orders_service → order_service_issues (join table) → orders_issues.issue_code (FK a failure_codes)
    let failureCodeIds: number[] = [];

    if (orderServiceIds?.length) {
      // Obtener los failure_code IDs (issue_code es la FK en orders_issues hacia failure_codes)
      const rows: { issue_code: number }[] = await orderServiceRepo
        .createQueryBuilder('os')
        .innerJoin('order_service_issues', 'osi', 'osi.order_service_id = os.id')
        .innerJoin('orders_issues', 'oi', 'oi.id = osi.order_issue_id')
        .select('oi.issue_code', 'issue_code')
        .where('os.id NOT IN (:...orderServiceIds)', { orderServiceIds })
        .andWhere('oi.issue_code IS NOT NULL')
        .distinct(true)
        .getRawMany();

      failureCodeIds = rows.map(r => r.issue_code).filter(id => id != null);
    }

    const qb = sotRepo.createQueryBuilder('sot')
      .leftJoinAndSelect('sot.service', 'service')
      .leftJoinAndSelect('sot.orderType', 'orderType')
      .leftJoinAndSelect('sot.issue', 'issue')
      .where('sot.order_type_id = :orderTypeId', { orderTypeId })
      .andWhere('sot.activo = true')
      .andWhere('service.activo = true');

    if (failureCodeIds.length) {
      qb.andWhere('sot.issue_id IN (:...failureCodeIds)', { failureCodeIds });
    } else {
      qb.andWhere('sot.issue_id IS NULL');
    }

    if (orderId) {
      const subQuery = orderServiceRepo
        .createQueryBuilder('os')
        .select('os.service_id')
        .where('os.order_id = :orderId', { orderId });

      qb.andWhere(`sot.service_id NOT IN (${subQuery.getQuery()})`)
        .setParameter('orderId', orderId);
    }

    return qb.orderBy('service.descripcion', 'ASC').getMany();
  }
}
