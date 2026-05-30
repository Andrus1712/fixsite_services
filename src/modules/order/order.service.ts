import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderIssueDto } from './dto/create-order-issue.dto';
import { Order, Customer, Device, OrderIssue, DeviceModel, Note } from '../../entities/branch';
import { Tenant } from '../../entities/global/tenant.entity';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { EntityManager } from 'typeorm';
import { LogType } from 'src/entities/branch/log-events.entity';
import { LogEventService } from '../log-events/logs-events.service';
import { OrderStatusEnum, ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS, VALID_TRANSITIONS } from 'src/common/enums';

@Injectable()
export class OrderService {
  constructor(
    private readonly tenantService: ConnectionDatabaseService,
    private readonly logEventService: LogEventService
  ) { }

  async create(tenant: Tenant, createOrderDto: CreateOrderDto, author: string) {
    const connection = await this.tenantService.getConnection(tenant);

    return await connection.transaction(async (manager) => {
      const customer = await this.findCustomerById(manager, createOrderDto.customer_data);
      const order = await this.createOrder(manager, createOrderDto, customer.id);
      const device = await this.createDevice(manager, createOrderDto.device_data, order.id);
      const issues = await this.createIssues(manager, createOrderDto.issues, order.id);
      const notes = await this.createOrderNotes(manager, createOrderDto.notes ?? [], order.id, author);

      const issuesWithRelations = await this.loadIssuesWithRelations(manager, issues);
      const deviceWithRelations = await this.loadDeviceWithRelations(manager, device);

      await this.logEventService.logWithManager(manager, {
        orderId: order.id,
        type: LogType.ORDER_CREATED,
        title: 'Orden de reparación creada',
        description: `Se ha registrado una nueva orden de reparación con código ${order.order_code}.`,
        user: author,
        icon: 'order_created',
        metadata: {
          order_code: order.order_code,
          device: device.device_name,
          issues_count: issues.length,
        },
      });

      return this.buildCreateOrderResponse(order, customer, deviceWithRelations, issuesWithRelations, notes);
    });
  }

  private async findCustomerById(manager: any, customerData: any) {
    const customer = await manager.findOne(Customer, {
      where: { id: customerData.customer_id },
    });

    if (!customer) {
      throw new Error(`Customer with ID ${customerData.customer_id} does not exist`);
    }

    return customer;
  }

  private async createOrder(manager: any, createOrderDto: CreateOrderDto, customerId: number) {
    const orderCode = await this.generateOrderCode(manager);

    const order = manager.create(Order, {
      order_code: orderCode,
      description: createOrderDto.description,
      status: OrderStatusEnum.PENDING,
      status_description: ORDER_STATUS_DESCRIPTIONS[OrderStatusEnum.PENDING],
      priority: createOrderDto.priority,
      priority_description: this.getPriorityDescription(createOrderDto.priority),
      customer_id: customerId,
      order_type_id: createOrderDto.order_type_id ?? null,
      estimated_cost: createOrderDto.cost_info.estimated_cost,
      labor_cost: createOrderDto.cost_info.labor_cost,
      parts_cost: createOrderDto.cost_info.parts_cost,
      currency: createOrderDto.cost_info.currency,
      estimated_hours: createOrderDto.timeline.estimated_hours,
    });

    return await manager.save(Order, order);
  }

  private async generateOrderCode(manager: EntityManager): Promise<string> {
    const prefix = '1-';
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const lastOrder = await manager
      .getRepository(Order)
      .createQueryBuilder('o')
      .where('o.order_code LIKE :pattern', { pattern: `${prefix}${datePart}-%` })
      .orderBy('o.order_code', 'DESC')
      .getOne();

    let nextSequence = 1;

    if (lastOrder) {
      const lastPart = lastOrder.order_code.split('-').pop();
      if (lastPart) {
        nextSequence = Number(lastPart) + 1;
      }
    }

    return `${prefix}${datePart}-${nextSequence.toString().padStart(5, '0')}`;
  }

  private async createDevice(manager: any, deviceData: any, orderId: number) {
    const deviceModel = await this.findDeviceModelById(manager, deviceData.device_model);

    const device = manager.create(Device, {
      device_name: deviceData.device_name,
      device_model: deviceModel.id,
      serial_number: deviceData.serial_number,
      imei: deviceData.imei,
      color: deviceData.color,
      storage_capacity: deviceData.storage_capacity,
      order_id: orderId,
    });

    return await manager.save(Device, device);
  }

  private async findDeviceModelById(manager: any, model_id: string) {
    const deviceModel = await manager.findOne(DeviceModel, { where: { id: model_id } });

    if (!deviceModel) {
      throw new Error(`Device Model with ID ${model_id} does not exist`);
    }

    return deviceModel;
  }

  private async createIssues(manager: any, issuesData: any[], orderId: number) {
    const issues: OrderIssue[] = [];

    for (const issueData of issuesData) {
      const issue = manager.create(OrderIssue, {
        title: issueData.title,
        description: issueData.description,
        failure_code_id: issueData.failure_code_id ?? null,
        additional_notes: issueData.additional_notes ?? null,
        steps_to_reproduce: issueData.steps_to_reproduce ?? null,
        reported_by: issueData.reported_by ?? 'customer',
        reported_date: new Date(),
        attachments: issueData.attachments ?? null,
        order_id: orderId,
      });
      const savedIssue = await manager.save(OrderIssue, issue);
      issues.push(savedIssue);
    }

    return issues;
  }

  private async createOrderNotes(manager: any, notesData: any[], orderId: number, author: string) {
    const notes: Note[] = [];

    if (!notesData) return notes;

    for (const noteData of notesData) {
      const { content, type } = noteData;
      const note = manager.create(Note, {
        type,
        content,
        order: orderId,
        author,
        timestamp: new Date(),
      });
      const savedNote = await manager.save(Note, note);
      notes.push(savedNote);
    }

    return notes;
  }

  private async loadIssuesWithRelations(manager: any, issues: OrderIssue[]) {
    return await manager.getRepository(OrderIssue).find({
      where: issues.map(i => ({ id: i.id })),
      relations: [
        'failureCode',
        'failureCode.severity',
        'failureCode.category',
        'failureCode.deviceType',
      ],
    });
  }

  private async loadDeviceWithRelations(manager: any, device: Device) {
    return await manager.getRepository(Device).findOne({
      where: { id: device.id },
      relations: ['deviceModel', 'deviceModel.deviceType', 'deviceModel.deviceBrand'],
    });
  }

  private buildCreateOrderResponse(
    order: Order,
    customer: Customer,
    deviceWithRelations: Device,
    issuesWithRelations: OrderIssue[],
    notes: Note[],
  ) {
    return {
      ...order,
      customer,
      devices: [deviceWithRelations],
      issues: issuesWithRelations,
      notes,
    };
  }

  private getPriorityDescription(priority: number): string {
    const priorities = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return priorities[priority] || 'medium';
  }

  private getStatusDescription(status: number): string {
    return ORDER_STATUS_DESCRIPTIONS[status as OrderStatusEnum] || 'unknown';
  }

  async getAllOrders(tenant: Tenant, page = 1, limit = 10, filter?: string) {
    const connection = await this.tenantService.getConnection(tenant);
    const repo = connection.getRepository(Order);

    const qb = repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.devices', 'devices')
      .leftJoinAndSelect('order.issues', 'issues')
      .leftJoinAndSelect('issues.failureCode', 'failure_code')
      .leftJoinAndSelect('failure_code.severity', 'failure_severity')
      .leftJoinAndSelect('failure_code.category', 'failure_category')
      .leftJoinAndSelect('failure_code.deviceType', 'issue_device_type')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.orderType', 'orderType')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('order.createdAt', 'DESC');

    if (filter) {
      qb.where(
        '(order.order_code LIKE :filter OR order.description LIKE :filter OR customer.customer_name LIKE :filter)',
        { filter: `%${filter}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getOrderInfo(tenant: Tenant, order_code: string) {
    const connection = await this.tenantService.getConnection(tenant);
    const repo = connection.getRepository(Order);

    const order = await repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.devices', 'devices')
      .leftJoinAndSelect('devices.deviceModel', 'deviceModel')
      .leftJoinAndSelect('deviceModel.deviceType', 'deviceType')
      .leftJoinAndSelect('deviceModel.deviceBrand', 'deviceBrand')
      .leftJoinAndSelect('order.issues', 'issues')
      .leftJoinAndSelect('issues.failureCode', 'failure_code')
      .leftJoinAndSelect('failure_code.severity', 'failure_severity')
      .leftJoinAndSelect('failure_code.category', 'failure_category')
      .leftJoinAndSelect('failure_code.deviceType', 'issue_device_type')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.orderType', 'orderType')
      .leftJoinAndSelect('order.notes', 'notes')
      .where('order.order_code = :order_code', { order_code })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async createIssue(tenant: Tenant, dto: CreateOrderIssueDto, author: string) {
    const connection = await this.tenantService.getConnection(tenant);

    return await connection.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: dto.order_id } });
      if (!order) {
        throw new NotFoundException(`Order with ID ${dto.order_id} not found`);
      }

      const issue = manager.create(OrderIssue, {
        title: dto.title,
        description: dto.description,
        failure_code_id: dto.failure_code_id ?? null,
        additional_notes: dto.additional_notes ?? null,
        steps_to_reproduce: dto.steps_to_reproduce ?? null,
        reported_by: dto.reported_by ?? 'customer',
        reported_date: new Date(),
        attachments: (dto.attachments ?? null) as any,
        order_id: dto.order_id,
      } as any);


      const saved = await manager.save(OrderIssue, issue);

      await this.logEventService.logWithManager(manager, {
        orderId: order.id,
        type: LogType.ISSUE_ADDED,
        title: 'Falla reportada',
        description: `Se agregó la falla "${dto.title}" a la orden ${order.order_code}.`,
        user: author,
        icon: 'issue_added',
        metadata: {
          order_code: order.order_code,
          issue_id: saved.id,
          issue_title: dto.title,
          failure_code_id: dto.failure_code_id ?? null,
        },
      });

      return manager.getRepository(OrderIssue).findOne({
        where: { id: saved.id },
        relations: [
          'failureCode',
          'failureCode.severity',
          'failureCode.category',
          'failureCode.deviceType',
        ],
      });
    });
  }

  async assignOrder(tenant: Tenant, body: any, author: string) {
    const connection = await this.tenantService.getConnection(tenant);

    return await connection.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { order_code: body.orderCode } });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      order.assigned_technician_id = body.technicianId;

      // Si la orden está en PENDING, avanzar a ASSIGNED automáticamente
      if (order.status === OrderStatusEnum.PENDING) {
        order.status = OrderStatusEnum.ASSIGNED;
        order.status_description = ORDER_STATUS_DESCRIPTIONS[OrderStatusEnum.ASSIGNED];
      }

      await manager.save(Order, order);

      await this.logEventService.logWithManager(manager, {
        orderId: order.id,
        type: LogType.ORDER_ASSIGNED,
        title: 'Técnico asignado',
        description: `Se asignó un técnico a la orden ${order.order_code}.`,
        user: author,
        icon: 'technician_assigned',
        metadata: {
          order_code: order.order_code,
          technician_id: body.technicianId,
        },
      });

      return order;
    });
  }

  async updateOrderStatus(tenant: Tenant, orderCode: string, status: number, author: string, notes?: string) {
    const connection = await this.tenantService.getConnection(tenant);

    const order = await connection.getRepository(Order).findOne({
      where: { order_code: orderCode },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status as OrderStatusEnum;
    const newStatus = status as OrderStatusEnum;

    // Validar que el nuevo estado existe en el enum
    if (!ORDER_STATUS_DESCRIPTIONS[newStatus]) {
      throw new BadRequestException(`Estado ${status} no es válido`);
    }

    // Validar transición permitida
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transición no permitida: no se puede pasar de "${ORDER_STATUS_LABELS[currentStatus]}" a "${ORDER_STATUS_LABELS[newStatus]}"`
      );
    }

    // Si va a WAITING_PARTS, las notas son obligatorias
    if (newStatus === OrderStatusEnum.WAITING_PARTS && !notes) {
      throw new BadRequestException('Se requiere una observación al marcar como "Esperando repuestos"');
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.status_description = ORDER_STATUS_DESCRIPTIONS[newStatus];

    // Si se completa, registrar fecha de completado
    if (newStatus === OrderStatusEnum.COMPLETED) {
      order.actual_completion = new Date();
    }

    await connection.getRepository(Order).save(order);

    await this.logEventService.log(tenant, {
      orderId: order.id,
      type: LogType.ORDER_STATUS_CHANGE,
      title: 'Estado de orden actualizado',
      description: `El estado de la orden ${orderCode} fue actualizado de "${ORDER_STATUS_LABELS[previousStatus as OrderStatusEnum]}" a "${ORDER_STATUS_LABELS[newStatus]}".`,
      user: author,
      icon: 'status_updated',
      metadata: {
        order_code: order.order_code,
        previous_status: previousStatus,
        previous_status_description: ORDER_STATUS_DESCRIPTIONS[previousStatus as OrderStatusEnum],
        new_status: newStatus,
        new_status_description: ORDER_STATUS_DESCRIPTIONS[newStatus],
        notes: notes ?? null,
      },
    });

    return order;
  }
  async unassignOrder(tenant: Tenant, orderCode: string, author: string) {
    const connection = await this.tenantService.getConnection(tenant);

    return await connection.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { order_code: orderCode },
        relations: ['technician'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (!order.assigned_technician_id) {
        throw new BadRequestException('La orden no tiene un técnico asignado');
      }

      // Solo permitir desasignar si está en PENDING o ASSIGNED
      const allowedStatuses = [OrderStatusEnum.PENDING, OrderStatusEnum.ASSIGNED];
      if (!allowedStatuses.includes(order.status as OrderStatusEnum)) {
        throw new BadRequestException(
          `No se puede desasignar el técnico cuando la orden está en estado "${ORDER_STATUS_LABELS[order.status as OrderStatusEnum]}". Solo es posible en estados: Pendiente o Asignada.`,
        );
      }

      const previousTechnicianId = order.assigned_technician_id;

      await manager
        .createQueryBuilder()
        .update(Order)
        .set({
          assigned_technician_id: () => 'NULL',
          status: OrderStatusEnum.PENDING,
          status_description: ORDER_STATUS_DESCRIPTIONS[OrderStatusEnum.PENDING],
        })
        .where('id = :id', { id: order.id })
        .execute();

      order.assigned_technician_id = null as any;
      order.status = OrderStatusEnum.PENDING;
      order.status_description = ORDER_STATUS_DESCRIPTIONS[OrderStatusEnum.PENDING];

      await this.logEventService.logWithManager(manager, {
        orderId: order.id,
        type: LogType.ORDER_UNASSIGNED,
        title: 'Técnico desasignado',
        description: `Se desasignó el técnico de la orden ${order.order_code}. La orden volvió a estado Pendiente.`,
        user: author,
        icon: 'technician_unassigned',
        metadata: {
          order_code: order.order_code,
          previous_technician_id: previousTechnicianId,
        },
      });

      return order;
    });
  }

  async getOrderTimeline(tenant: Tenant, orderCode: string) {
    const connection = await this.tenantService.getConnection(tenant);
    const orderRepo = connection.getRepository(Order);

    const order = await orderRepo.findOne({ where: { order_code: orderCode } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.logEventService.getTimeline(tenant, order.id);
  }
  async getOrdersByCustomer(tenant: Tenant, customerId: number) {
    const connection = await this.tenantService.getConnection(tenant);
    const repo = connection.getRepository(Order);

    return await repo.find({
      where: { customer: { id: customerId } },
      relations: [
        'customer',
        'devices',
        'issues',
        'issues.failureCode',
        'issues.failureCode.severity',
        'issues.failureCode.category',
        'issues.failureCode.deviceType',
        'technician',
        'orderType',
      ],
      order: { createdAt: 'DESC' },
    });
  }
  async getOrdersByTechnician(tenant: Tenant, technicianId: number) {
    const connection = await this.tenantService.getConnection(tenant);
    const repo = connection.getRepository(Order);

    return await repo.find({
      where: { assigned_technician_id: technicianId },
      relations: [
        'customer',
        'devices',
        'issues',
        'issues.failureCode',
        'issues.failureCode.severity',
        'issues.failureCode.category',
        'issues.failureCode.deviceType',
        'technician',
        'orderType',
      ],
      order: { createdAt: 'DESC' },
    });
  }
  async getOrdersGroupedByStatus(tenant: Tenant) {
    const connection = await this.tenantService.getConnection(tenant);
    const repo = connection.getRepository(Order);

    const result = await repo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return result.map(item => ({
      status: parseInt(item.status),
      count: parseInt(item.count),
      description: ORDER_STATUS_DESCRIPTIONS[parseInt(item.status) as OrderStatusEnum] || 'unknown',
      label: ORDER_STATUS_LABELS[parseInt(item.status) as OrderStatusEnum] || 'Desconocido',
    }));
  }
}
