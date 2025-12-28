import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { TenantAwareService } from 'src/database/tenant-aware.service';
import { TenantConnectionService } from 'src/database/tenant-connection.service';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, TenantAwareService, TenantConnectionService],
  exports: [MaintenanceService],
})
export class MaintenanceModule { }