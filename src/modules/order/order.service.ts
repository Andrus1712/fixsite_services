import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantConnectionService } from '../../database/tenant-connection.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, Customer, Device, Issue } from '../../entities/branch';
import { Tenant } from '../../entities/global/tenant.entity';
import { OrderResponseDto } from './dto/order-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class OrderService {
  constructor(
    private tenantConnectionService: TenantConnectionService,
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,
  ) { }

  async create(createOrderDto: CreateOrderDto, tenantId: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }

    const connection = await this.tenantConnectionService.getConnection(tenant);

    return await connection.transaction(async (manager) => {
      // 1. Crear o encontrar cliente
      let customer = await manager.findOne(Customer, {
        where: { customer_email: createOrderDto.customer_data.customer_email }
      });

      if (!customer) {
        customer = manager.create(Customer, createOrderDto.customer_data);
        customer = await manager.save(Customer, customer);
      }

      // 2. Crear orden
      const order = manager.create(Order, {
        order_code: createOrderDto.order_code,
        description: createOrderDto.description,
        status: 1,
        status_description: 'pending',
        priority: createOrderDto.priority,
        priority_description: this.getPriorityDescription(createOrderDto.priority),
        customer_id: customer.id,
        estimated_cost: createOrderDto.cost_info.estimated_cost,
        labor_cost: createOrderDto.cost_info.labor_cost,
        parts_cost: createOrderDto.cost_info.parts_cost,
        currency: createOrderDto.cost_info.currency,
        estimated_completion: new Date(createOrderDto.timeline.estimated_completion),
        estimated_hours: createOrderDto.timeline.estimated_hours,
        sla_deadline: new Date(createOrderDto.timeline.sla_deadline),
      });

      const savedOrder = await manager.save(Order, order);

      // 3. Crear dispositivo
      const device = manager.create(Device, {
        ...createOrderDto.device_data,
        device_type_description: 'smartphone',
        device_brand_type: 'Unknown',
        order_id: savedOrder.id,
      });

      await manager.save(Device, device);

      // 4. Crear issues
      for (const issueData of createOrderDto.issues) {
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
          order_id: savedOrder.id,
        });

        await manager.save(Issue, issue);
      }

      return savedOrder;
    });
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

  async getAllOrders(tenantId: string, page = 1, limit = 10) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    const connection = await this.tenantConnectionService.getConnection(tenant);

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