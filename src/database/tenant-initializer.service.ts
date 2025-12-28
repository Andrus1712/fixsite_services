import { Injectable, OnModuleInit } from '@nestjs/common';
import { TenantConnectionService } from './tenant-connection.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/global/tenant.entity';

@Injectable()
export class TenantInitializerService implements OnModuleInit {
  constructor(
    private tenantConnectionService: TenantConnectionService,
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,
  ) {}

  async onModuleInit() {
    // Solo ejecutar en desarrollo
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Obtener todos los tenants y crear sus conexiones
    const tenants = await this.tenantRepository.find();
    
    for (const tenant of tenants) {
      try {
        await this.tenantConnectionService.getConnection(tenant);
        console.log(`[DEV] Tables initialized for tenant: ${tenant.name}`);
      } catch (error) {
        console.log(error);
        
        console.error(`[DEV] Failed to initialize tenant ${tenant.name}:`, error);
      }
    }
  }
}