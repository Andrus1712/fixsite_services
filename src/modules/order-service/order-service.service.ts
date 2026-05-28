import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Tenant } from 'src/entities/global/tenant.entity';
import { OrderService } from 'src/entities/branch/order-service.entity';
import { OrderIssue } from 'src/entities/branch/issue.entity';
import { OrderIssueStatus } from 'src/entities/branch/issue.entity';
import { Order } from 'src/entities/branch/order.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';
import { OrderServiceResponseDto } from './dto/order-service-response.dto';
import { LogEventService } from '../log-events/logs-events.service';
import { LogType } from 'src/entities/branch/log-events.entity';
import { OrderStatusEnum, ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS } from 'src/common/enums';

@Injectable()
export class OrderServiceService {
  constructor(
    private readonly tenantAwareService: ConnectionDatabaseService,
    private readonly logEventService: LogEventService,
  ) { }

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
    const entity = await repo.findOne({
      where: { id },
      relations: ['service', 'order', 'issues', 'issues.failureCode'],
    });
    if (!entity) throw new NotFoundException(`OrderService with ID ${id} not found`);
    return entity;
  }

  async findOrderServiceByOrderId(tenant: Tenant, orderId: number) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);

    const rows = await repo.createQueryBuilder('os')
      .leftJoinAndSelect('os.service', 'service')
      .leftJoin('os.issues', 'issue')
      .leftJoin('issue.failureCode', 'failureCode')
      .addSelect([
        'issue.id',
        'issue.title',
        'issue.description',
        'issue.status',
        'issue.is_resolved',
        'failureCode.code',
        'failureCode.name',
      ])
      .where('os.order_id = :orderId', { orderId })
      .getMany();

    return plainToInstance(OrderServiceResponseDto, rows, { excludeExtraneousValues: true });
  }

  async create(tenant: Tenant, dto: CreateOrderServiceDto, author: string) {
    const connection = await this.tenantAwareService.getConnection(tenant);
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(OrderService);

      const entity = repo.create({
        order: { id: dto.order_id } as any,
        service: { id: dto.service_id } as any,
        price: dto.price,
        estimated_minutes: dto.estimated_minutes,
        notes: dto.notes,
      });

      const saved = await queryRunner.manager.save(entity);

      if (dto.issue_ids?.length) {
        saved.issues = dto.issue_ids.map(id => ({ id }) as OrderIssue);
        await queryRunner.manager.save(saved);

        // Marcar las fallas como resueltas
        await queryRunner.manager
          .createQueryBuilder()
          .update(OrderIssue)
          .set({ status: OrderIssueStatus.RESOLVED, is_resolved: true })
          .whereInIds(dto.issue_ids)
          .execute();
      }

      await this.logEventService.logWithManager(queryRunner.manager, {
        orderId: dto.order_id,
        type: LogType.SERVICE_ADDED,
        title: 'Servicio asignado',
        description: `Se asignó un servicio a la orden.`,
        user: author,
        icon: 'service_added',
        metadata: {
          service_id: dto.service_id,
          price: dto.price,
          estimated_minutes: dto.estimated_minutes,
          issues_resolved: dto.issue_ids ?? [],
        },
      });

      // Auto-completar: si todas las fallas de la orden están resueltas → COMPLETED
      if (dto.issue_ids?.length) {
        const pendingIssues = await queryRunner.manager
          .getRepository(OrderIssue)
          .count({ where: { order_id: dto.order_id, is_resolved: false } });

        if (pendingIssues === 0) {
          const order = await queryRunner.manager
            .getRepository(Order)
            .findOne({ where: { id: dto.order_id } });

          if (order && order.status !== OrderStatusEnum.COMPLETED) {
            const previousStatus = order.status;
            await queryRunner.manager
              .getRepository(Order)
              .update(dto.order_id, {
                status: OrderStatusEnum.COMPLETED,
                status_description: ORDER_STATUS_DESCRIPTIONS[OrderStatusEnum.COMPLETED],
                actual_completion: new Date(),
              });

            await this.logEventService.logWithManager(queryRunner.manager, {
              orderId: dto.order_id,
              type: LogType.ORDER_STATUS_CHANGE,
              title: 'Orden completada automáticamente',
              description: `Todas las fallas han sido resueltas. La orden pasó de "${ORDER_STATUS_LABELS[previousStatus as OrderStatusEnum]}" a "${ORDER_STATUS_LABELS[OrderStatusEnum.COMPLETED]}".`,
              user: 'system',
              icon: 'order_completed',
              metadata: {
                trigger: 'all_issues_resolved',
                previous_status: previousStatus,
                new_status: OrderStatusEnum.COMPLETED,
              },
            });
          }
        }
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

  async remove(tenant: Tenant, id: number, author: string) {
    const connection = await this.tenantAwareService.getConnection(tenant);
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(OrderService);
      const entity = await repo.findOne({ where: { id }, relations: ['issues', 'order'] });

      if (!entity) {
        await queryRunner.rollbackTransaction();
        return;
      }

      const revertedIssueIds: number[] = [];

      if (entity.issues?.length) {
        // Revertir solo las fallas que no estén cubiertas por otro OrderService
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
              .set({ status: OrderIssueStatus.PENDING, is_resolved: false })
              .where('id = :id', { id: issue.id })
              .execute();
            revertedIssueIds.push(issue.id);
          }
        }
      }

      const orderId = entity.order?.id;

      await repo.delete(id);

      if (orderId) {
        await this.logEventService.logWithManager(queryRunner.manager, {
          orderId,
          type: LogType.SERVICE_REMOVED,
          title: 'Servicio eliminado',
          description: `Se eliminó un servicio de la orden.`,
          user: author,
          icon: 'service_removed',
          metadata: {
            order_service_id: id,
            issues_reverted_to_pending: revertedIssueIds,
          },
        });

        // Reversión: si la orden estaba COMPLETED y ahora hay fallas pendientes → volver a IN_REPAIR
        if (revertedIssueIds.length > 0) {
          const order = await queryRunner.manager
            .getRepository(Order)
            .findOne({ where: { id: orderId } });

          if (order && order.status === OrderStatusEnum.COMPLETED) {
            await queryRunner.manager
              .getRepository(Order)
              .update(orderId, {
                status: OrderStatusEnum.IN_REPAIR,
                status_description: ORDER_STATUS_DESCRIPTIONS[OrderStatusEnum.IN_REPAIR],
                actual_completion: null as any,
              });

            await this.logEventService.logWithManager(queryRunner.manager, {
              orderId,
              type: LogType.ORDER_STATUS_CHANGE,
              title: 'Orden reabierta',
              description: `Se eliminó un servicio y hay fallas sin resolver. La orden volvió a "${ORDER_STATUS_LABELS[OrderStatusEnum.IN_REPAIR]}".`,
              user: 'system',
              icon: 'order_reopened',
              metadata: {
                trigger: 'service_removed_issues_pending',
                previous_status: OrderStatusEnum.COMPLETED,
                new_status: OrderStatusEnum.IN_REPAIR,
                reverted_issues: revertedIssueIds,
              },
            });
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateIssueStatus(tenant: Tenant, issueId: number, status: OrderIssueStatus) {
    const repo = await this.tenantAwareService.getRepository(OrderIssue, tenant);
    const isResolved = status === OrderIssueStatus.RESOLVED;
    return repo.update(issueId, { status, is_resolved: isResolved });
  }
}
