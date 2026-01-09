import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { globalDatabaseConfig } from './config/database.config';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { OrderModule } from './modules/order/order.module';
import { InfoDevicesModule } from './modules/info-devices/info-devices.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConnectionDatabaseService } from './database/connection-database.service';
import { SqlContextInterceptor } from './common/interceptors/sql-context.interceptor';
import { TenantResolverMiddleware } from './common/middleware/tenant-resolver.middleware';
import { Tenant } from './entities/global/tenant.entity';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ConnectionModule } from './database/conecction.module';

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
    TypeOrmModule.forFeature([Tenant], 'globalConnection'),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '24h' },
    }),
    ConnectionModule,
    TenantModule,
    UserModule,
    AuthModule,
    UploadModule,
    OrderModule,
    InfoDevicesModule,
    MaintenanceModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantResolverMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: SqlContextInterceptor,
    }
  ],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantResolverMiddleware)
      .exclude(
        'auth/*path',
        'tenant/*path',
        'upload/*path',
        { path: '/', method: RequestMethod.GET },
      )
      .forRoutes(
        'info-devices/*path',
        'failures/*path',
        'user/*path',
        'maintenance/*path',
        'orders/*path'
      );
  }
}
