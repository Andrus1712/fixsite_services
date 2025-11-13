import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { Tenant } from '../../entities/global/tenant.entity';
import { TenantConnectionService } from '../../database/tenant-connection.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant], 'globalConnection'),
  ],
  controllers: [TenantController],
  providers: [TenantService, TenantConnectionService],
  exports: [TenantService, TenantConnectionService, TypeOrmModule],
})
export class TenantModule {}