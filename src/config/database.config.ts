import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const globalDatabaseConfig = registerAs(
  'globalDatabase',
  (): TypeOrmModuleOptions => ({
    type: process.env.GLOBAL_DB_TYPE as any,
    host: process.env.GLOBAL_DB_HOST,
    port: Number(process.env.GLOBAL_DB_PORT),
    username: process.env.GLOBAL_DB_USERNAME,
    password: process.env.GLOBAL_DB_PASSWORD,
    database: process.env.GLOBAL_DB_DATABASE,
    entities: [__dirname + '/../entities/global/*.entity{.ts,.js}'],
    synchronize: process.env.GLOBAL_DB_SYNCHRONIZE === 'true',
    logging: process.env.GLOBAL_DB_LOGGING === 'true',
  }),
);