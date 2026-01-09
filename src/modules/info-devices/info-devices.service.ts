import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DeviceType } from '../../entities/branch/device-type.entity';
import { DeviceBrand } from '../../entities/branch/device-brand.entity';
import { DeviceModel } from '../../entities/branch/device-model.entity';
import { PasswordType } from '../../entities/branch/password-type.entity';
import { Tenant } from '../../entities/global/tenant.entity';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';

@Injectable()
export class InfoDevicesService {
  constructor(
    private readonly tenantAwareService: ConnectionDatabaseService,
  ) { }

  // Device Types
  async getAllDeviceTypes(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string) {
    const deviceTypeRepository = await this.tenantAwareService.getRepository(DeviceType, tenant);
    const queryBuilder = deviceTypeRepository.createQueryBuilder('deviceType');

    if (filter) {
      queryBuilder.where('deviceType.name LIKE :filter OR deviceType.description LIKE :filter', {
        filter: `%${filter}%`
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllDeviceTypes(tenant: Tenant) {
    const deviceTypeRepository = await this.tenantAwareService.getRepository(DeviceType, tenant);
    const [data, total] = await deviceTypeRepository.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneDeviceType(tenant: Tenant, id: string): Promise<DeviceType | null> {
    const deviceTypeRepository = await this.tenantAwareService.getRepository(DeviceType, tenant);
    return deviceTypeRepository.findOne({ where: { id } });
  }

  async createDeviceType(tenant: Tenant, data: Partial<DeviceType>): Promise<DeviceType> {
    const deviceTypeRepository = await this.tenantAwareService.getRepository(DeviceType, tenant);
    const deviceType = deviceTypeRepository.create(data);
    return deviceTypeRepository.save(deviceType);
  }

  async updateDeviceType(tenant: Tenant, id: string, data: Partial<DeviceType>): Promise<DeviceType | null> {
    const deviceTypeRepository = await this.tenantAwareService.getRepository(DeviceType, tenant);
    await deviceTypeRepository.update(id, data);
    return this.findOneDeviceType(tenant, id);
  }

  async removeDeviceType(tenant: Tenant, id: string): Promise<void> {
    const deviceTypeRepository = await this.tenantAwareService.getRepository(DeviceType, tenant);
    await deviceTypeRepository.delete(id);
  }

  // Device Brands
  async getAllDeviceBrands(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string) {
    const deviceBrandRepository = await this.tenantAwareService.getRepository(DeviceBrand, tenant);
    const queryBuilder = deviceBrandRepository.createQueryBuilder('deviceBrand');

    if (filter) {
      queryBuilder.where('deviceBrand.name LIKE :filter OR deviceBrand.description LIKE :filter', {
        filter: `%${filter}%`
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllDeviceBrands(tenant: Tenant) {
    const deviceBrandRepository = await this.tenantAwareService.getRepository(DeviceBrand, tenant);
    const [data, total] = await deviceBrandRepository.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneDeviceBrand(tenant: Tenant, id: string): Promise<DeviceBrand | null> {
    const deviceBrandRepository = await this.tenantAwareService.getRepository(DeviceBrand, tenant);
    return deviceBrandRepository.findOne({ where: { id } });
  }

  async createDeviceBrand(tenant: Tenant, data: Partial<DeviceBrand>): Promise<DeviceBrand> {
    const deviceBrandRepository = await this.tenantAwareService.getRepository(DeviceBrand, tenant);
    const deviceBrand = deviceBrandRepository.create(data);
    return deviceBrandRepository.save(deviceBrand);
  }

  async updateDeviceBrand(tenant: Tenant, id: string, data: Partial<DeviceBrand>): Promise<DeviceBrand | null> {
    const deviceBrandRepository = await this.tenantAwareService.getRepository(DeviceBrand, tenant);
    await deviceBrandRepository.update(id, data);
    return this.findOneDeviceBrand(tenant, id);
  }

  async removeDeviceBrand(tenant: Tenant, id: string): Promise<void> {
    const deviceBrandRepository = await this.tenantAwareService.getRepository(DeviceBrand, tenant);
    await deviceBrandRepository.delete(id);
  }

  // Device Models
  async getAllDeviceModels(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string, brandId?: string, typeId?: string) {
    const deviceModelRepository = await this.tenantAwareService.getRepository(DeviceModel, tenant);
    const queryBuilder = deviceModelRepository.createQueryBuilder('deviceModel')
      .leftJoinAndSelect('deviceModel.deviceType', 'deviceType')
      .leftJoinAndSelect('deviceModel.deviceBrand', 'deviceBrand');

    const conditions: string[] = [];
    const parameters: any = {};

    if (filter) {
      conditions.push('(deviceModel.name LIKE :filter OR deviceModel.description LIKE :filter)');
      parameters.filter = `%${filter}%`;
    }

    if (brandId) {
      conditions.push('deviceModel.deviceBrandId = :brandId');
      parameters.brandId = brandId;
    }

    if (typeId) {
      conditions.push('deviceModel.deviceTypeId = :typeId');
      parameters.typeId = typeId;
    }

    if (conditions.length > 0) {
      queryBuilder.where(conditions.join(' AND '), parameters);
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllDeviceModels(tenant: Tenant) {
    const deviceModelRepository = await this.tenantAwareService.getRepository(DeviceModel, tenant);
    const [data, total] = await deviceModelRepository.findAndCount({ relations: ['deviceType', 'deviceBrand'] });
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneDeviceModel(tenant: Tenant, id: string): Promise<DeviceModel | null> {
    const deviceModelRepository = await this.tenantAwareService.getRepository(DeviceModel, tenant);
    return deviceModelRepository.findOne({
      where: { id },
      relations: ['deviceType', 'deviceBrand']
    });
  }

  async createDeviceModel(tenant: Tenant, data: Partial<DeviceModel>): Promise<DeviceModel> {
    const deviceModelRepository = await this.tenantAwareService.getRepository(DeviceModel, tenant);
    const deviceModel = deviceModelRepository.create(data);
    return deviceModelRepository.save(deviceModel);
  }

  async updateDeviceModel(tenant: Tenant, id: string, data: Partial<DeviceModel>): Promise<DeviceModel | null> {
    const deviceModelRepository = await this.tenantAwareService.getRepository(DeviceModel, tenant);
    await deviceModelRepository.update(id, data);
    return this.findOneDeviceModel(tenant, id);
  }

  async removeDeviceModel(tenant: Tenant, id: string): Promise<void> {
    const deviceModelRepository = await this.tenantAwareService.getRepository(DeviceModel, tenant);
    await deviceModelRepository.delete(id);
  }

  // Password Types
  async getAllPasswordTypes(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string) {
    const passwordTypeRepository = await this.tenantAwareService.getRepository(PasswordType, tenant);
    const queryBuilder = passwordTypeRepository.createQueryBuilder('passwordType');

    if (filter) {
      queryBuilder.where('passwordType.name LIKE :filter OR passwordType.description LIKE :filter', {
        filter: `%${filter}%`
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllPasswordTypes(tenant: Tenant) {
    const passwordTypeRepository = await this.tenantAwareService.getRepository(PasswordType, tenant);
    const [data, total] = await passwordTypeRepository.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOnePasswordType(tenant: Tenant, id: string): Promise<PasswordType | null> {
    const passwordTypeRepository = await this.tenantAwareService.getRepository(PasswordType, tenant);
    return passwordTypeRepository.findOne({ where: { id } });
  }

  async createPasswordType(tenant: Tenant, data: Partial<PasswordType>): Promise<PasswordType> {
    const passwordTypeRepository = await this.tenantAwareService.getRepository(PasswordType, tenant);
    const passwordType = passwordTypeRepository.create(data);
    return passwordTypeRepository.save(passwordType);
  }

  async updatePasswordType(tenant: Tenant, id: string, data: Partial<PasswordType>): Promise<PasswordType | null> {
    const passwordTypeRepository = await this.tenantAwareService.getRepository(PasswordType, tenant);
    await passwordTypeRepository.update(id, data);
    return this.findOnePasswordType(tenant, id);
  }

  async removePasswordType(tenant: Tenant, id: string): Promise<void> {
    const passwordTypeRepository = await this.tenantAwareService.getRepository(PasswordType, tenant);
    await passwordTypeRepository.delete(id);
  }
}