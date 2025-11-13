import { Injectable } from '@nestjs/common';
import { Repository, EntityTarget, ObjectLiteral } from 'typeorm';
import { TenantConnectionService } from './tenant-connection.service';
import { Tenant } from '../entities/global/tenant.entity';

@Injectable()
export class TenantAwareService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    tenant: Tenant,
  ): Promise<Repository<T>> {
    const connection = await this.tenantConnectionService.getConnection(tenant);
    return connection.getRepository(entity);
  }
}