import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { globalDatabaseConfig } from './config/database.config';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { OrderModule } from './modules/order/order.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TenantInitializerService } from './database/tenant-initializer.service';
import { TenantConnectionService } from './database/tenant-connection.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [globalDatabaseConfig],
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    TypeOrmModule.forRootAsync({
      name: 'globalConnection',
      useFactory: globalDatabaseConfig,
      inject: [globalDatabaseConfig.KEY],
    }),
    TenantModule,
    UserModule,
    AuthModule,
    UploadModule,
    OrderModule
  ],
  controllers: [AppController],
  providers: [AppService, TenantConnectionService, TenantInitializerService],
})
export class AppModule {}
