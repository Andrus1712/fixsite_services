import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Tenant } from 'src/entities/global/tenant.entity';
import { OrderService } from 'src/entities/branch/order-service.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';
import { OrderServiceResponseDto } from './dto/order-service-response.dto';
import { OrderIssue } from 'src/entities/branch';
import { OrderIssuesStatus } from 'src/entities/branch/issue.entity';

@Injectable()
export class OrderServiceService {
  constructor(private readonly tenantAwareService: ConnectionDatabaseService) { }

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
    return repo.findOne({ where: { id }, relations: ['service', 'order', 'issues'] });
  }

  async findOrderServiceByOrderId(tenant: Tenant, orderId: number) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);

    const rows = await repo.createQueryBuilder('os')
      .leftJoinAndSelect('os.service', 'service')
      .leftJoin('os.issues', 'issue')
      .leftJoin('issue.issue_code', 'failureCode')
      .addSelect([
        'issue.id',
        'issue.issue_name',
        'issue.issue_description',
        'issue.status',
        'issue.is_resolved',
        'failureCode.code',
        'failureCode.name',
      ])
      .where('os.order_id = :orderId', { orderId })
      .getMany();

    return plainToInstance(OrderServiceResponseDto, rows, { excludeExtraneousValues: true });
  }

  async create(tenant: Tenant, dto: CreateOrderServiceDto) {
    const connection = await this.tenantAwareService.getConnection(tenant);
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(OrderService);

      const entity = repo.create({
        order: { id: dto.order_id } as any,
        service: { id: dto.service_id } as any,
        precio: dto.precio,
        tiempo_estimado_minutos: dto.tiempo_estimado_minutos,
        notas: dto.notas,
      });

      const saved = await queryRunner.manager.save(entity);

      if (dto.issues_ids?.length) {
        saved.issues = dto.issues_ids.map(id => ({ id }) as OrderIssue);
        await queryRunner.manager.save(saved);

        await queryRunner.manager
          .createQueryBuilder()
          .update(OrderIssue)
          .set({ status: OrderIssuesStatus.RESOLVED, is_resolved: true })
          .whereInIds(dto.issues_ids)
          .execute();
      }

      await queryRunner.commitTransaction();
      return this.findOne(tenant, saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(tenant: Tenant, id: number, dto: UpdateOrderServiceDto) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);
    await repo.save({ id, ...dto });
    return this.findOne(tenant, id);
  }

  async remove(tenant: Tenant, id: number) {
    const connection = await this.tenantAwareService.getConnection(tenant);
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(OrderService);
      const entity = await repo.findOne({ where: { id }, relations: ['issues'] });

      if (!entity) {
        await queryRunner.rollbackTransaction();
        return;
      }

      if (entity.issues?.length) {
        // Solo revertir los issues que no tengan otro OrderService que los cubra
        for (const issue of entity.issues) {
          const otherServiceCount = await queryRunner.manager
            .createQueryBuilder(OrderService, 'os')
            .innerJoin('os.issues', 'oi', 'oi.id = :issueId', { issueId: issue.id })
            .where('os.id != :id', { id })
            .getCount();

          if (otherServiceCount === 0) {
            await queryRunner.manager
              .createQueryBuilder()
              .update(OrderIssue)
              .set({ status: OrderIssuesStatus.PENDING, is_resolved: false })
              .where('id = :id', { id: issue.id })
              .execute();
          }
        }
      }

      await repo.delete(id);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatusOrderIssue(tenant: Tenant, issueId: number, status: any) {
    const repo = await this.tenantAwareService.getRepository(OrderIssue, tenant);
    const isResolved = status === 'RESOLVED';
    return await repo.query(
      `UPDATE orders_issues SET status = $1, is_resolved = $2 WHERE id = $3`,
      [status, isResolved, issueId],
    );
  }
}
