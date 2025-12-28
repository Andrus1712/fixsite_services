import { Injectable } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Tenant } from '../entities/global/tenant.entity';
import * as branchEntities from '../entities/branch';

@Injectable()
export class TenantConnectionService {
  private connections = new Map<string, DataSource>();

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

  async closeConnection(tenantId: string): Promise<void> {
    const connection = this.connections.get(tenantId);
    if (connection && connection.isInitialized) {
      await connection.destroy();
      this.connections.delete(tenantId);
    }
  }
}