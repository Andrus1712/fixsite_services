import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from '../../entities/global/tenant.entity';
import { ConnectionDatabaseService } from '../../database/connection-database.service';

interface CreateTenantDto {
  name: string;
  subdomain: string;
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword: string;
}

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenantConnectionService: ConnectionDatabaseService,
  ) { }

  async createTenant(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const databaseName = `tenant_${createTenantDto.subdomain}`;

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      databaseName,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Crear la base de datos del tenant
    await this.createTenantDatabase(savedTenant);

    return savedTenant;
  }

  async getTenantConnection(tenant: Tenant): Promise<DataSource> {
    return this.tenantConnectionService.getConnection(tenant);
  }

  private async createTenantDatabase(tenant: Tenant): Promise<void> {
    // Crear conexión y sincronizar esquema
    const connection = await this.tenantConnectionService.getConnection(tenant);
    await connection.synchronize();
  }

  async getUserTenats(userId: string) {
    return this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.users', 'user')
      .select([
        'tenant.id',
        'tenant.name',
        'tenant.subdomain',
        'tenant.databaseName',
        'user.username'
      ])
      .where('user.id = :userId', { userId })
      .getMany();
  }

  async getTentsBySubdomain(subdomain: string) {
    return this.tenantRepository.findOne({
      where: { subdomain }
    });

  }

  async getAllTenants(page: number, limit: number, filter?: string) {
    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

    if (filter) {
      queryBuilder.where('tenant.name ILIKE :filter OR tenant.subdomain ILIKE :filter', {
        filter: `%${filter}%`
      });
    }

    const [tenants, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: tenants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getTenantById(id: string | null) {
    if (!id) {
      return null;
    }
    return this.tenantRepository.findOne({
      where: { id }
    });
  }
}