import { Injectable } from '@nestjs/common';
import { FailureCategory } from '../../entities/branch/failure-categories.entity';
import { FailureCode } from '../../entities/branch/failure-codes.entity';
import { FailureSeverity } from '../../entities/branch/failure-severities.entity';
import { TenantAwareService } from '../../database/tenant-aware.service';
import { Tenant } from '../../entities/global/tenant.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly tenantAwareService: TenantAwareService,
  ) {}

  // Failure Categories
  async getAllFailureCategories(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string) {
    const repository = await this.tenantAwareService.getRepository(FailureCategory, tenant);
    const queryBuilder = repository.createQueryBuilder('failureCategory');
    
    if (filter) {
      queryBuilder.where('failureCategory.name LIKE :filter OR failureCategory.description LIKE :filter', {
        filter: `%${filter}%`
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllFailureCategories(tenant: Tenant) {
    const repository = await this.tenantAwareService.getRepository(FailureCategory, tenant);
    const [data, total] = await repository.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneFailureCategory(tenant: Tenant, id: string): Promise<FailureCategory | null> {
    const repository = await this.tenantAwareService.getRepository(FailureCategory, tenant);
    return repository.findOne({ where: { id: parseInt(id) } });
  }

  async createFailureCategory(tenant: Tenant, data: Partial<FailureCategory>): Promise<FailureCategory> {
    const repository = await this.tenantAwareService.getRepository(FailureCategory, tenant);
    const entity = repository.create(data);
    return repository.save(entity);
  }

  async updateFailureCategory(tenant: Tenant, id: string, data: Partial<FailureCategory>): Promise<FailureCategory | null> {
    const repository = await this.tenantAwareService.getRepository(FailureCategory, tenant);
    await repository.update(parseInt(id), data);
    return this.findOneFailureCategory(tenant, id);
  }

  async removeFailureCategory(tenant: Tenant, id: string): Promise<void> {
    const repository = await this.tenantAwareService.getRepository(FailureCategory, tenant);
    await repository.delete(parseInt(id));
  }

  // Failure Codes
  async getAllFailureCodes(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string, categoryId?: string, deviceTypeId?: string, severityId?: string) {
    const repository = await this.tenantAwareService.getRepository(FailureCode, tenant);
    const queryBuilder = repository.createQueryBuilder('failureCode')
      .leftJoinAndSelect('failureCode.category', 'category')
      .leftJoinAndSelect('failureCode.deviceType', 'deviceType')
      .leftJoinAndSelect('failureCode.severity', 'severity');
    
    const conditions: string[] = [];
    const parameters: any = {};

    if (filter) {
      conditions.push('(failureCode.name LIKE :filter OR failureCode.code LIKE :filter OR failureCode.description LIKE :filter)');
      parameters.filter = `%${filter}%`;
    }

    if (categoryId) {
      conditions.push('failureCode.category.id = :categoryId');
      parameters.categoryId = parseInt(categoryId);
    }

    if (deviceTypeId) {
      conditions.push('failureCode.deviceType.id = :deviceTypeId');
      parameters.deviceTypeId = deviceTypeId;
    }

    if (severityId) {
      conditions.push('failureCode.severity.id = :severityId');
      parameters.severityId = parseInt(severityId);
    }

    if (conditions.length > 0) {
      queryBuilder.where(conditions.join(' AND '), parameters);
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllFailureCodes(tenant: Tenant) {
    const repository = await this.tenantAwareService.getRepository(FailureCode, tenant);
    const [data, total] = await repository.findAndCount({ relations: ['category', 'deviceType', 'severity'] });
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneFailureCode(tenant: Tenant, id: string): Promise<FailureCode | null> {
    const repository = await this.tenantAwareService.getRepository(FailureCode, tenant);
    return repository.findOne({ 
      where: { id: parseInt(id) }, 
      relations: ['category', 'deviceType', 'severity'] 
    });
  }

  async createFailureCode(tenant: Tenant, data: Partial<FailureCode>): Promise<FailureCode> {
    const repository = await this.tenantAwareService.getRepository(FailureCode, tenant);
    const entity = repository.create(data);
    return repository.save(entity);
  }

  async updateFailureCode(tenant: Tenant, id: string, data: Partial<FailureCode>): Promise<FailureCode | null> {
    const repository = await this.tenantAwareService.getRepository(FailureCode, tenant);
    await repository.update(parseInt(id), data);
    return this.findOneFailureCode(tenant, id);
  }

  async removeFailureCode(tenant: Tenant, id: string): Promise<void> {
    const repository = await this.tenantAwareService.getRepository(FailureCode, tenant);
    await repository.delete(parseInt(id));
  }

  // Failure Severities
  async getAllFailureSeverities(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string) {
    const repository = await this.tenantAwareService.getRepository(FailureSeverity, tenant);
    const queryBuilder = repository.createQueryBuilder('failureSeverity');
    
    if (filter) {
      queryBuilder.where('failureSeverity.name LIKE :filter OR failureSeverity.description LIKE :filter', {
        filter: `%${filter}%`
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('failureSeverity.priority', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllFailureSeverities(tenant: Tenant) {
    const repository = await this.tenantAwareService.getRepository(FailureSeverity, tenant);
    const [data, total] = await repository.findAndCount({ order: { priority: 'ASC' } });
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneFailureSeverity(tenant: Tenant, id: string): Promise<FailureSeverity | null> {
    const repository = await this.tenantAwareService.getRepository(FailureSeverity, tenant);
    return repository.findOne({ where: { id: parseInt(id) } });
  }

  async createFailureSeverity(tenant: Tenant, data: Partial<FailureSeverity>): Promise<FailureSeverity> {
    const repository = await this.tenantAwareService.getRepository(FailureSeverity, tenant);
    const entity = repository.create(data);
    return repository.save(entity);
  }

  async updateFailureSeverity(tenant: Tenant, id: string, data: Partial<FailureSeverity>): Promise<FailureSeverity | null> {
    const repository = await this.tenantAwareService.getRepository(FailureSeverity, tenant);
    await repository.update(parseInt(id), data);
    return this.findOneFailureSeverity(tenant, id);
  }

  async removeFailureSeverity(tenant: Tenant, id: string): Promise<void> {
    const repository = await this.tenantAwareService.getRepository(FailureSeverity, tenant);
    await repository.delete(parseInt(id));
  }
}