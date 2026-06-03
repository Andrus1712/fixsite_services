import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Tenant } from 'src/entities/global/tenant.entity';
import { OrderService } from 'src/entities/branch/order-service.entity';
import { OrderIssue } from 'src/entities/branch/issue.entity';
import { OrderIssueStatus } from 'src/entities/branch/issue.entity';
import { Order } from 'src/entities/branch/order.entity';
import { Service } from 'src/entities/branch/service.entity';
import { Store } from 'src/entities/branch/store.entity';
import { OrderServicePart } from 'src/entities/branch/order-service-part.entity';
import { MaterialIssue, MaterialIssueStatus } from 'src/entities/branch/material-issues.entity';
import { MaterialIssueItem } from 'src/entities/branch/material-issue-items.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';
import { OrderServiceResponseDto } from './dto/order-service-response.dto';
import { LogEventService } from '../log-events/logs-events.service';
import { ServiceArticleService } from '../service-article/service-article.service';
import { InventoryService } from '../inventory/inventory-core/inventory.service';
import { LogType } from 'src/entities/branch/log-events.entity';
import { OrderStatusEnum, ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS } from 'src/common/enums';

@Injectable()
export class OrderServiceService {
  constructor(
    private readonly tenantAwareService: ConnectionDatabaseService,
    private readonly logEventService: LogEventService,
    private readonly serviceArticleService: ServiceArticleService,
    private readonly inventoryService: InventoryService,
  ) { }

  async getAll(tenant: Tenant, page = 1, limit = 10, orderId?: number) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);
    const qb = repo.createQueryBuilder('os')
      .leftJoinAndSelect('os.service', 'service')
      .leftJoinAndSelect('os.order', 'order')
      .leftJoinAndSelect('os.parts', 'parts');

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
      relations: ['service', 'order', 'issues', 'issues.failureCode', 'parts', 'parts.article', 'parts.store', 'materialIssue'],
    });
    if (!entity) throw new NotFoundException(`OrderService with ID ${id} not found`);
    return entity;
  }

  async findOrderServiceByOrderId(tenant: Tenant, orderId: number) {
    const repo = await this.tenantAwareService.getRepository(OrderService, tenant);

    const rows = await repo.createQueryBuilder('os')
      .leftJoinAndSelect('os.service', 'service')
      .leftJoinAndSelect('os.parts', 'part')
      .leftJoinAndSelect('part.article', 'partArticle')
      .leftJoinAndSelect('part.store', 'partStore')
      .leftJoinAndSelect('os.materialIssue', 'materialIssue')
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
    // --- Parts validation (before transaction) ---
    const serviceRepo = await this.tenantAwareService.getRepository(Service, tenant);
    const service = await serviceRepo.findOne({ where: { id: dto.service_id } });

    if (!service) {
      throw new NotFoundException(`Servicio con ID ${dto.service_id} no encontrado`);
    }

    if (service.requires_articles) {
      // Validate parts is non-empty
      if (!dto.parts || dto.parts.length === 0) {
        throw new BadRequestException(
          "Este servicio requiere partes. Debe incluir un array 'parts' no vacío",
        );
      }

      // Validate store_id is present
      if (!dto.store_id) {
        throw new BadRequestException(
          'Debe especificar store_id cuando se incluyen partes',
        );
      }

      // Validate no duplicate article_id in parts
      const articleIds = dto.parts.map(p => p.article_id);
      const uniqueIds = new Set(articleIds);
      if (uniqueIds.size !== articleIds.length) {
        throw new BadRequestException(
          'No se permiten artículos duplicados en la misma solicitud',
        );
      }

      // Validate all articles are configured and active for this service
      await this.serviceArticleService.validateArticlesForService(
        tenant,
        dto.service_id,
        articleIds,
      );

      // Validate Store exists and is active
      const storeRepo = await this.tenantAwareService.getRepository(Store, tenant);
      const store = await storeRepo.findOne({ where: { id: dto.store_id } });
      if (!store || !store.active) {
        throw new BadRequestException(
          `El almacén con ID ${dto.store_id} no existe o está inactivo`,
        );
      }

      // Stock validation (pre-check before transaction)
      const aggregated = new Map<number, number>();
      for (const part of dto.parts) {
        aggregated.set(part.article_id, (aggregated.get(part.article_id) || 0) + part.quantity);
      }

      const insufficientStock: { article_id: number; required: number; available: number }[] = [];

      for (const [articleId, requiredQty] of aggregated) {
        const hasStock = await this.inventoryService.validateStock(tenant, articleId, dto.store_id, requiredQty);
        if (!hasStock) {
          const available = await this.inventoryService.getStock(tenant, articleId, dto.store_id);
          insufficientStock.push({ article_id: articleId, required: requiredQty, available });
        }
      }

      if (insufficientStock.length > 0) {
        throw new BadRequestException({
          message: 'Stock insuficiente para completar la solicitud',
          errors: insufficientStock,
        });
      }
    } else {
      // If service does NOT require articles, ignore parts and store_id
      dto.parts = undefined;
      dto.store_id = undefined;
    }

    // --- Transaction (existing logic) ---
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

      // --- Parts persistence and MaterialIssue generation ---
      if (service.requires_articles && dto.parts?.length) {
        const ospRepo = queryRunner.manager.getRepository(OrderServicePart);
        const miRepo = queryRunner.manager.getRepository(MaterialIssue);
        const miiRepo = queryRunner.manager.getRepository(MaterialIssueItem);

        // 1. Create OrderServicePart records (one per parts item)
        const partEntities = dto.parts.map(p => ospRepo.create({
          order_service_id: saved.id,
          article_id: p.article_id,
          quantity: p.quantity,
          store_id: dto.store_id,
        }));
        await ospRepo.save(partEntities);

        // 2. Create MaterialIssue in DRAFT status
        const materialIssue = miRepo.create({
          store: { id: dto.store_id } as any,
          status: MaterialIssueStatus.DRAFT,
          createdBy: author,
        });
        const savedMI = await miRepo.save(materialIssue);

        // 3. Create MaterialIssueItem for each part
        const miItems = dto.parts.map(p => miiRepo.create({
          materialIssue: savedMI,
          article: { id: p.article_id } as any,
          quantity: p.quantity,
          destinationReference: { id: dto.order_id } as any,
        }));
        await miiRepo.save(miItems);

        // 4. Update OrderService with material_issue_id
        await queryRunner.manager
          .getRepository(OrderService)
          .update(saved.id, { material_issue_id: savedMI.id });
      }

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
      const entity = await repo.findOne({ where: { id }, relations: ['issues', 'order', 'materialIssue'] });

      if (!entity) {
        await queryRunner.rollbackTransaction();
        return;
      }

      // MaterialIssue handling: block deletion if approved, cancel if DRAFT/PENDING
      if (entity.material_issue_id && entity.materialIssue) {
        if (entity.materialIssue.status === MaterialIssueStatus.APPROVED) {
          await queryRunner.rollbackTransaction();
          throw new BadRequestException(
            'No se puede eliminar: el egreso de material ya fue aprobado',
          );
        }

        // Cancel MaterialIssue if DRAFT or PENDING
        if (
          entity.materialIssue.status === MaterialIssueStatus.DRAFT ||
          entity.materialIssue.status === MaterialIssueStatus.PENDING
        ) {
          await queryRunner.manager
            .getRepository(MaterialIssue)
            .update(entity.material_issue_id, { status: MaterialIssueStatus.CANCELLED });
        }
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
