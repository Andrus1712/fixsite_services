import { DataSource } from 'typeorm';
import { Tenant } from '../entities/global/tenant.entity';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export async function initializeDatabase() {
  // Crear conexión a la BD global
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

  // Crear tenant de ejemplo
  // const tenantRepository = globalConnection.getRepository(Tenant);

  // const existingTenant = await tenantRepository.findOne({
  //   where: { subdomain: 'demo' },
  // });

  // if (!existingTenant) {
  //   const demoTenant = tenantRepository.create({
  //     name: 'Demo Company',
  //     subdomain: 'demo',
  //     databaseName: 'tenant_demo',
  //     dbHost: 'localhost',
  //     dbPort: 5432,
  //     dbUsername: 'postgres',
  //     dbPassword: 'password',
  //   });

  //   await tenantRepository.save(demoTenant);
  //   console.log('Demo tenant created successfully');
  // }

  await globalConnection.destroy();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase().catch(console.error);
}