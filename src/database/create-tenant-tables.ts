import { DataSource } from 'typeorm';
import { Tenant } from '../entities/global/tenant.entity';
import * as dotenv from 'dotenv';
import * as branchEntities from '../entities/branch';

dotenv.config();

export async function createTenantTables(tenantId: string) {
  // Conectar a BD global para obtener datos del tenant
  const globalConnection = new DataSource({
    type: 'postgres',
    host: process.env.GLOBAL_DB_HOST || 'localhost',
    port: parseInt(process.env.GLOBAL_DB_PORT || '5432', 10),
    username: process.env.GLOBAL_DB_USERNAME || 'postgres',
    password: String(process.env.GLOBAL_DB_PASSWORD || 'password'),
    database: process.env.GLOBAL_DB_DATABASE || 'fixsite_global',
    entities: [Tenant],
    synchronize: true,
  });

  await globalConnection.initialize();
  
  const tenantRepository = globalConnection.getRepository(Tenant);
  const tenant = await tenantRepository.findOne({ where: { id: tenantId } });
  
  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found`);
  }

  // Crear conexión al tenant específico
  const tenantConnection = new DataSource({
    type: 'postgres',
    host: tenant.dbHost,
    port: tenant.dbPort,
    username: tenant.dbUsername,
    password: tenant.dbPassword,
    database: tenant.databaseName,
    entities: Object.values(branchEntities),
    synchronize: true,
    logging: true,
  });

  await tenantConnection.initialize();
  console.log(`Tables created for tenant: ${tenant.name}`);
  
  await tenantConnection.destroy();
  await globalConnection.destroy();
}

// Función para crear tenant demo y sus tablas
export async function createDemoTenant() {
  const globalConnection = new DataSource({
    type: 'postgres',
    host: process.env.GLOBAL_DB_HOST || 'localhost',
    port: parseInt(process.env.GLOBAL_DB_PORT || '5432', 10),
    username: process.env.GLOBAL_DB_USERNAME || 'postgres',
    password: String(process.env.GLOBAL_DB_PASSWORD || 'password'),
    database: process.env.GLOBAL_DB_DATABASE || 'fixsite_global',
    entities: [Tenant],
    synchronize: true,
  });

  await globalConnection.initialize();
  
  const tenantRepository = globalConnection.getRepository(Tenant);
  
  let tenant = await tenantRepository.findOne({ where: { subdomain: 'demo' } });
  
  if (!tenant) {
    tenant = tenantRepository.create({
      name: 'Demo Company',
      subdomain: 'demo',
      databaseName: 'tenant_demo',
      dbHost: process.env.GLOBAL_DB_HOST || 'localhost',
      dbPort: parseInt(process.env.GLOBAL_DB_PORT || '5432', 10),
      dbUsername: process.env.GLOBAL_DB_USERNAME || 'postgres',
      dbPassword: String(process.env.GLOBAL_DB_PASSWORD || 'password'),
    });
    
    await tenantRepository.save(tenant);
    console.log('Demo tenant created');
  }

  await globalConnection.destroy();
  
  // Crear tablas para el tenant
  await createTenantTables(tenant.id);
}

if (require.main === module) {
  createDemoTenant().catch(console.error);
}