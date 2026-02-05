import { Module } from '@nestjs/common';
import { InfoDevicesController } from './info-devices.controller';
import { InfoDevicesService } from './info-devices.service';

@Module({
  imports: [],
  controllers: [InfoDevicesController],
  providers: [InfoDevicesService],
  exports: [InfoDevicesService],
})
export class InfoDevicesModule { }