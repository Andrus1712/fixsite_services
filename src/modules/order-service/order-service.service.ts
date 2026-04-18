import { Injectable } from '@nestjs/common';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Tenant } from 'src/entities/global/tenant.entity';
import { OrderService } from 'src/entities/branch/order-service.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';

@Injectable()
export class OrderServiceService {
  constructor(private readonly tenantAwareService: ConnectionDatabaseService) {}

  async getAll(tenant: Tenant, page = 1, limit = 10, orderId?: number) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);
    const qb = repo.createQueryBuilder('os')
      .leftJoinAndSelect('os.service', 'service')
      .leftJoinAndSelect('os.order', 'order');

    if (orderId) {
      qb.where('os.order_id = :orderId', { orderId });
    }

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);
    return repo.findOne({ where: { id }, relations: ['service', 'order'] });
  }

  async create(tenant: Tenant, dto: CreateOrderServiceDto) {
    
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);
    const entity = repo.create({
      ...dto,
      order: { id: dto.order_id } as any,
      service: { id: dto.service_id } as any,
    });
    return repo.save(entity);
  }

  async update(tenant: Tenant, id: number, dto: UpdateOrderServiceDto) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);
    await repo.save({ id, ...dto });
    return this.findOne(tenant, id);
  }

  async remove(tenant: Tenant, id: number) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);
    await repo.delete(id);
  }
}
