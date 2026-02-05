import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, Customer, Device, Issue, DeviceModel, Note, LogEvents } from '../../entities/branch';
import { Tenant } from '../../entities/global/tenant.entity';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { EntityManager } from 'typeorm';
import { LogStatus, LogType } from 'src/entities/branch/log-events.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly tenantService: ConnectionDatabaseService,
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

      await this.createAndSaveLogEvent(manager, order, device, issues, notes, author);

      return this.buildCreateOrderResponse(order, customer, deviceWithRelations, issuesWithRelations, notes);
    });
  }

  private async findCustomerById(manager: any, customerData: any) {
    const customer = await manager.findOne(Customer, {
      where: { id: customerData.customer_id }
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
      status: 1,
      status_description: 'pending',
      priority: createOrderDto.priority,
      priority_description: this.getPriorityDescription(createOrderDto.priority),
      customer_id: customerId,
      estimated_cost: createOrderDto.cost_info.estimated_cost,
      labor_cost: createOrderDto.cost_info.labor_cost,
      parts_cost: createOrderDto.cost_info.parts_cost,
      currency: createOrderDto.cost_info.currency,
      // estimated_completion: new Date(createOrderDto.timeline.estimated_completion),
      estimated_hours: createOrderDto.timeline.estimated_hours,
      // sla_deadline: new Date(createOrderDto.timeline.sla_deadline),
    });

    return await manager.save(Order, order);
  }

  private async generateOrderCode(manager: EntityManager): Promise<string> {
    const prefix = '1-';
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const lastOrder = await manager
      .getRepository(Order)
      .createQueryBuilder('o')
      .where('o.order_code LIKE :pattern', {
        pattern: `${prefix}${datePart}-%`,
      })
      .orderBy('o.order_code', 'DESC')
      .getOne();

    let nextSequence = 1;

    if (lastOrder) {
      const lastPart = lastOrder.order_code.split('-').pop();

      if (lastPart) {
        const lastSeq = Number(lastPart);
        nextSequence = lastSeq + 1;
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
    const deviceModel = await manager.findOne(DeviceModel, {
      where: { id: model_id }
    });

    if (!deviceModel) {
      throw new Error(`Device Model with ID ${model_id} does not exist`);
    }

    return deviceModel;
  }

  private async createIssues(manager: any, issuesData: any[], orderId: number) {
    const issues: Issue[] = [];

    for (const issueData of issuesData) {
      const issueDataWithDefaults = {
        ...this.buildIssueData(issueData),
        order_id: orderId
      };

      const issue = manager.create(Issue, issueDataWithDefaults);
      const savedIssue = await manager.save(Issue, issue);
      issues.push(savedIssue);
    }

    return issues;
  }

  private async createOrderNotes(manager: any, notesData: any[], orderId: number, author: string) {
    const notes: Note[] = [];

    if (!notesData) {
      return notes;
    }

    for (const noteData of notesData) {
      const { content, type } = noteData;
      const note = manager.create(Note, {
        type: type,
        content: content,
        order: orderId,
        author: author,
        timestamp: new Date(),
      });

      const savedNote = await manager.save(Note, note);
      notes.push(savedNote);
    }

    return notes;
  }

  private async loadIssuesWithRelations(manager: any, issues: Issue[]) {
    return await manager.getRepository(Issue).find({
      where: issues.map(i => ({ id: i.id })),
      relations: [
        'issue_code',
        'issue_code.severity',
        'issue_code.category',
        'issue_code.deviceType'
      ]
    });
  }

  private async loadDeviceWithRelations(manager: any, device: Device) {
    return await manager.getRepository(Device).findOne({
      where: { id: device.id },
      relations: ['deviceModel', 'deviceModel.deviceType', 'deviceModel.deviceBrand']
    });
  }

  private async createAndSaveLogEvent(
    manager: any,
    order: Order,
    device: Device,
    issues: Issue[],
    notes: Note[],
    author: string
  ) {
    const logEvent = manager.create(LogEvents, {
      title: `Orden de reparacion creada`,
      description: `Se ha registrado una nueva orden de reparación en el sistema con código ${order.order_code}.`,
      type: LogType.CREATED,
      status: LogStatus.SUCCESS,
      user: author,
      order: order,
      icon: 'order_created',
      metadata: this.buildLogEventMetadata(order, device, issues, notes, author),
      timestamp: new Date()
    });

    await manager.save(LogEvents, logEvent);
  }

  private buildLogEventMetadata(
    order: Order,
    device: Device,
    issues: Issue[],
    notes: Note[],
    author: string
  ): Record<string, any> {
    return {
      "Codigo": order.order_code,
      "Dispositivo": device.device_name,
      "Daños reportados": issues.length,
    };
  }

  private buildCreateOrderResponse(
    order: Order,
    customer: Customer,
    deviceWithRelations: Device,
    issuesWithRelations: Issue[],
    notes: Note[]
  ) {
    return {
      ...order,
      customer,
      devices: [deviceWithRelations],
      issues: issuesWithRelations,
      notes
    };
  }

  private getPriorityDescription(priority: number): string {
    const priorities = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return priorities[priority] || 'medium';
  }

  private getIssueTypeDescription(type: number): string {
    const types = { 1: 'hardware', 2: 'screen', 3: 'software', 4: 'battery' };
    return types[type] || 'hardware';
  }

  private getSeverityDescription(severity: number): string {
    const severities = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return severities[severity] || 'medium';
  }

  private buildIssueData(issueData: any): any {
    return {
      ...issueData,
      issue_code: { id: issueData.issue_code },
      issue_type_description: this.getIssueTypeDescription(issueData.issue_type),
      issue_severity_description: this.getSeverityDescription(issueData.issue_severity),
      issue_reproducibility: 1,
      issue_reproducibility_description: 'always',
      issue_frequency: 1,
      issue_frequency_description: 'always',
      issue_impact: issueData.issue_severity,
      issue_impact_description: this.getSeverityDescription(issueData.issue_severity),
      issue_difficulty: 2,
      issue_difficulty_description: 'medium',
      issue_priority: issueData.issue_severity,
      issue_priority_description: this.getSeverityDescription(issueData.issue_severity),
      issue_urgency: issueData.issue_severity,
      issue_urgency_description: this.getSeverityDescription(issueData.issue_severity),
      issue_detection: 1,
      issue_detection_description: 'immediate',
      issue_reported_by: 'customer',
      issue_reported_date: new Date(),
      issue_reported_time: new Date().toTimeString().slice(0, 5),
      order_id: issueData.orderId,
    };
  }

  async getAllOrders(
    tenant: Tenant,
    page = 1,
    limit = 10,
    filter?: string,
  ) {
    const connection = await this.tenantService.getConnection(tenant);
    const repo = connection.getRepository(Order);

    const skip = (page - 1) * limit;

    const qb = repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.devices', 'devices')
      .leftJoinAndSelect('order.issues', 'issues')
      .leftJoinAndSelect('issues.issue_code', 'failure_code')
      .leftJoinAndSelect('failure_code.severity', 'failure_severity')
      .leftJoinAndSelect('failure_code.category', 'failure_category')
      .leftJoinAndSelect('failure_code.deviceType', 'issue_device_type')
      .leftJoinAndSelect('order.technician', 'technician')
      .skip(skip)
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
      .leftJoinAndSelect('issues.issue_code', 'failure_code')
      .leftJoinAndSelect('failure_code.severity', 'failure_severity')
      .leftJoinAndSelect('failure_code.category', 'failure_category')
      .leftJoinAndSelect('failure_code.deviceType', 'issue_device_type')
      .leftJoinAndSelect('order.technician', 'technician')
      .leftJoinAndSelect('order.notes', 'notes')
      .leftJoinAndSelect('order.technician', 'technicians')
      .where('order.order_code = :order_code', { order_code })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async assignOrder(tenant: Tenant, body: any, author: string) {
    const connection = await this.tenantService.getConnection(tenant);
    return await connection.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { order_code: body.orderCode }
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      order.assigned_technician_id = body.technicianId;

      await manager.save(Order, order);

      return order;
    });
  }
}