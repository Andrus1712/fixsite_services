import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TenantConnectionService } from '../../database/tenant-connection.service';
import { Tenant } from '../../entities/global/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant], 'globalConnection'),
  ],
  controllers: [OrderController],
  providers: [OrderService, TenantConnectionService],
})
export class OrderModule { }