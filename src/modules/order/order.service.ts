import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, Customer, Device, Issue } from '../../entities/branch';
import { Tenant } from '../../entities/global/tenant.entity';
import { OrderResponseDto } from './dto/order-response.dto';
import { plainToInstance } from 'class-transformer';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { EntityManager } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    private readonly tenantService: ConnectionDatabaseService,
  ) { }

  async create(tenant: Tenant, createOrderDto: CreateOrderDto) {
    if (!tenant) {
      throw new Error('Tenant ID is required');
    }

    const connection = await this.tenantService.getConnection(tenant);

    return await connection.transaction(async (manager) => {
      const customer = await this.createOrFindCustomer(manager, createOrderDto.customer_data);
      const order = await this.createOrder(manager, createOrderDto, customer.id);
      const device = await this.createDevice(manager, createOrderDto.device_data, order.id);
      const issues = await this.createIssues(manager, createOrderDto.issues, order.id);

      return this.formatOrderResponse(order, customer, device, issues, createOrderDto);
    });
  }

  private async createOrFindCustomer(manager: any, customerData: any) {
    let customer = await manager.findOne(Customer, {
      where: { customer_email: customerData.customer_email }
    });

    if (!customer) {
      customer = manager.create(Customer, customerData);
      customer = await manager.save(Customer, customer);
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
    const device = manager.create(Device, {
      ...deviceData,
      model_year: "",
      device_type_description: 'smartphone',
      device_brand_type: 'Unknown',
      order_id: orderId,
    });

    return await manager.save(Device, device);
  }

  private async createIssues(manager: any, issuesData: any[], orderId: number) {
    const issues: Issue[] = [];

    for (const issueData of issuesData) {
      const issue = manager.create(Issue, {
        ...issueData,
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
        order_id: orderId,
      });

      const savedIssue = await manager.save(Issue, issue);
      issues.push(savedIssue);
    }

    return issues;
  }

  private formatOrderResponse(order: Order, customer: Customer, device: Device, issues: Issue[], originalDto: CreateOrderDto) {
    return {
      serviceType: originalDto.serviceType,
      description: order.description,
      device_data: {
        device_name: device.device_name,
        device_type: device.device_type,
        device_brand: device.device_brand,
        device_model: device.device_model,
        serial_number: device.serial_number,
        imei: device.imei,
        color: device.color || '',
        storage_capacity: device.storage_capacity || ''
      },
      issues: issues.map(issue => ({
        issue_name: issue.issue_name,
        issue_description: issue.issue_description,
        issue_type: issue.issue_type,
        issue_code: issue.issue_code,
        issue_severity: issue.issue_severity,
        issue_additional_info: issue.issue_additional_info || '',
        issue_steps_to_reproduce: issue.issue_steps_to_reproduce || [],
        issue_environment: issue.issue_environment || '',
        issue_additional_notes: issue.issue_additional_notes || '',
        issue_files: issue.issue_files || []
      })),
      customer_data: {
        customer_id: customer.id,
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
        customer_address: customer.customer_address || '',
        customer_type: customer.customer_type,
        preferred_contact: customer.preferred_contact
      },
      cost_info: {
        estimated_cost: order.estimated_cost,
        labor_cost: order.labor_cost,
        parts_cost: order.parts_cost,
        currency: order.currency
      },
      timeline: {
        estimated_completion: order.estimated_completion?.toISOString() || '',
        estimated_hours: order.estimated_hours,
        sla_deadline: order.sla_deadline?.toISOString() || ''
      },
      priority: order.priority
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

  async getAllOrders(tenant: Tenant, page = 1, limit = 10) {
    if (!tenant) {
      throw new Error('Tenant ID is required');
    }

    const connection = await this.tenantService.getConnection(tenant);

    const orderRepository = connection.getRepository(Order);

    const [orders, total] = await orderRepository.findAndCount({
      relations: ['customer', 'devices', 'issues', 'technician'],
    });


    const data = plainToInstance(OrderResponseDto, orders, {
      excludeExtraneousValues: false,
    });


    return {
      data,
      total,
      page: 1,
      totalPages: 1,
    };
  }
}