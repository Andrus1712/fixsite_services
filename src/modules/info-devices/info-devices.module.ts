import { Module } from '@nestjs/common';
import { InfoDevicesController } from './info-devices.controller';
import { InfoDevicesService } from './info-devices.service';
import { TenantAwareService } from '../../database/tenant-aware.service';
import { TenantConnectionService } from '../../database/tenant-connection.service';

@Module({
  controllers: [InfoDevicesController],
  providers: [InfoDevicesService, TenantAwareService, TenantConnectionService],
  exports: [InfoDevicesService],
})
export class InfoDevicesModule {}