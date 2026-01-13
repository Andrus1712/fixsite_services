import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { Tenant } from 'src/entities/global/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant], 'globalConnection'),
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService, TypeOrmModule],
})
export class TenantModule { }