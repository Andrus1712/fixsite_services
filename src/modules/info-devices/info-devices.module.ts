import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfoDevicesController } from './info-devices.controller';
import { InfoDevicesService } from './info-devices.service';
import { DeviceType } from '../../entities/global/device-type.entity';
import { DeviceBrand } from '../../entities/global/device-brand.entity';
import { DeviceModel } from '../../entities/global/device-model.entity';
import { PasswordType } from '../../entities/global/password-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceType,
      DeviceBrand,
      DeviceModel,
      PasswordType,
    ], 'globalConnection'),
  ],
  controllers: [InfoDevicesController],
  providers: [InfoDevicesService],
  exports: [InfoDevicesService],
})
export class InfoDevicesModule {}