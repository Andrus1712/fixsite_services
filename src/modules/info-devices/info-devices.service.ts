import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceType } from '../../entities/global/device-type.entity';
import { DeviceBrand } from '../../entities/global/device-brand.entity';
import { DeviceModel } from '../../entities/global/device-model.entity';
import { PasswordType } from '../../entities/global/password-type.entity';

@Injectable()
export class InfoDevicesService {
  constructor(
    @InjectRepository(DeviceType, 'globalConnection')
    private readonly deviceTypeRepository: Repository<DeviceType>,
    @InjectRepository(DeviceBrand, 'globalConnection')
    private readonly deviceBrandRepository: Repository<DeviceBrand>,
    @InjectRepository(DeviceModel, 'globalConnection')
    private readonly deviceModelRepository: Repository<DeviceModel>,
    @InjectRepository(PasswordType, 'globalConnection')
    private readonly passwordTypeRepository: Repository<PasswordType>,
  ) {}

  // Device Types
  async getAllDeviceTypes(page: number = 1, limit: number = 10, filter?: string) {
    const queryBuilder = this.deviceTypeRepository.createQueryBuilder('deviceType');
    
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

  async findAllDeviceTypes() {
    const [data, total] = await this.deviceTypeRepository.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneDeviceType(id: string): Promise<DeviceType | null> {
    return this.deviceTypeRepository.findOne({ where: { id } });
  }

  async createDeviceType(data: Partial<DeviceType>): Promise<DeviceType> {
    const deviceType = this.deviceTypeRepository.create(data);
    return this.deviceTypeRepository.save(deviceType);
  }

  async updateDeviceType(id: string, data: Partial<DeviceType>): Promise<DeviceType | null> {
    await this.deviceTypeRepository.update(id, data);
    return this.findOneDeviceType(id);
  }

  async removeDeviceType(id: string): Promise<void> {
    await this.deviceTypeRepository.delete(id);
  }

  // Device Brands
  async getAllDeviceBrands(page: number = 1, limit: number = 10, filter?: string) {
    const queryBuilder = this.deviceBrandRepository.createQueryBuilder('deviceBrand');
    
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

  async findAllDeviceBrands() {
    const [data, total] = await this.deviceBrandRepository.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneDeviceBrand(id: string): Promise<DeviceBrand | null> {
    return this.deviceBrandRepository.findOne({ where: { id } });
  }

  async createDeviceBrand(data: Partial<DeviceBrand>): Promise<DeviceBrand> {
    const deviceBrand = this.deviceBrandRepository.create(data);
    return this.deviceBrandRepository.save(deviceBrand);
  }

  async updateDeviceBrand(id: string, data: Partial<DeviceBrand>): Promise<DeviceBrand | null> {
    await this.deviceBrandRepository.update(id, data);
    return this.findOneDeviceBrand(id);
  }

  async removeDeviceBrand(id: string): Promise<void> {
    await this.deviceBrandRepository.delete(id);
  }

  // Device Models
  async getAllDeviceModels(page: number = 1, limit: number = 10, filter?: string, brandId?: string, typeId?: string) {
    const queryBuilder = this.deviceModelRepository.createQueryBuilder('deviceModel')
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

  async findAllDeviceModels() {
    const [data, total] = await this.deviceModelRepository.findAndCount({ relations: ['deviceType', 'deviceBrand'] });
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOneDeviceModel(id: string): Promise<DeviceModel | null> {
    return this.deviceModelRepository.findOne({ 
      where: { id }, 
      relations: ['deviceType', 'deviceBrand'] 
    });
  }

  async createDeviceModel(data: Partial<DeviceModel>): Promise<DeviceModel> {
    const deviceModel = this.deviceModelRepository.create(data);
    return this.deviceModelRepository.save(deviceModel);
  }

  async updateDeviceModel(id: string, data: Partial<DeviceModel>): Promise<DeviceModel | null> {
    await this.deviceModelRepository.update(id, data);
    return this.findOneDeviceModel(id);
  }

  async removeDeviceModel(id: string): Promise<void> {
    await this.deviceModelRepository.delete(id);
  }

  // Password Types
  async getAllPasswordTypes(page: number = 1, limit: number = 10, filter?: string) {
    const queryBuilder = this.passwordTypeRepository.createQueryBuilder('passwordType');
    
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

  async findAllPasswordTypes() {
    const [data, total] = await this.passwordTypeRepository.findAndCount();
    return { data, total, page: 1, limit: total, totalPages: 1 };
  }

  async findOnePasswordType(id: string): Promise<PasswordType | null> {
    return this.passwordTypeRepository.findOne({ where: { id } });
  }

  async createPasswordType(data: Partial<PasswordType>): Promise<PasswordType> {
    const passwordType = this.passwordTypeRepository.create(data);
    return this.passwordTypeRepository.save(passwordType);
  }

  async updatePasswordType(id: string, data: Partial<PasswordType>): Promise<PasswordType | null> {
    await this.passwordTypeRepository.update(id, data);
    return this.findOnePasswordType(id);
  }

  async removePasswordType(id: string): Promise<void> {
    await this.passwordTypeRepository.delete(id);
  }
}