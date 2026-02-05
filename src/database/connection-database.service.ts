import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityTarget, ObjectLiteral, DataSource, DataSourceOptions } from 'typeorm';
import { Tenant } from '../entities/global/tenant.entity';
import * as branchEntities from '../entities/branch';

@Injectable()
export class ConnectionDatabaseService implements OnModuleInit, OnModuleDestroy {
  private connections = new Map<string, DataSource>();
  private initialized = false;

  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,
  ) { }

  async onModuleInit() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const tenants = await this.tenantRepository.find();

      const connectionPromises = tenants.map(async (tenant) => {
        try {
          await this.getConnection(tenant);
          console.log(`[Database] Connection established for tenant: ${tenant.name}`);
        } catch (error) {
          console.error(`[Database] Error connecting tenant ${tenant.name}:`, error.message);
        }
      });

      await Promise.all(connectionPromises);
      console.log(`🚀 Total active connections: ${this.connections.size}`);
    } catch (error) {
      console.error('Critical error during tenant initialization:', error);
    }
  }

  async getConnection(tenant: Tenant): Promise<DataSource> {
    if (this.connections.has(tenant.id)) {
      const connection = this.connections.get(tenant.id);
      if (connection?.isInitialized) {
        return connection;
      }
    }

    const connectionOptions: DataSourceOptions = {
      type: 'postgres',
      host: tenant.dbHost,
      port: tenant.dbPort,
      username: tenant.dbUsername,
      password: tenant.dbPassword ? String(tenant.dbPassword) : '',
      database: tenant.databaseName,
      entities: Object.values(branchEntities),
      synchronize: true,
      logging: false,
      name: tenant.id,
    };

    const connection = new DataSource(connectionOptions);
    await connection.initialize();

    this.connections.set(tenant.id, connection);
    return connection;
  }

  async getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    tenant: Tenant,
  ): Promise<Repository<T>> {
    const connection = await this.getConnection(tenant);
    return connection.getRepository(entity);
  }
  async onModuleDestroy() {
    console.log('Cerrando conexiones de tenants...');

    // Especificamos el tipo explícitamente como Promise<void>[]
    const closePromises: Promise<void>[] = [];

    for (const [tenantId, connection] of this.connections.entries()) {
      if (connection.isInitialized) {
        console.log(`Cerrando conexión del tenant: ${tenantId}`);
        closePromises.push(connection.destroy());
      }
    }

    await Promise.all(closePromises);
    this.connections.clear();
    console.log('Todas las conexiones de base de datos han sido cerradas.');
  }

  async closeConnection(tenantId: string): Promise<void> {
    const connection = this.connections.get(tenantId);
    if (connection && connection.isInitialized) {
      await connection.destroy();
      this.connections.delete(tenantId);
    }
  }
}