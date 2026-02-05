import { DataSource } from 'typeorm';
import { DeviceType } from '../entities/branch/device-type.entity';
import { DeviceBrand } from '../entities/branch/device-brand.entity';
import { PasswordType } from '../entities/branch/password-type.entity';

export async function seedDeviceData(dataSource: DataSource) {
  const deviceTypeRepository = dataSource.getRepository(DeviceType);
  const deviceBrandRepository = dataSource.getRepository(DeviceBrand);
  const passwordTypeRepository = dataSource.getRepository(PasswordType);

  // Seed Device Types
  const deviceTypes = [
    { name: 'smartphone', description: 'Teléfono inteligente' },
    { name: 'tablet', description: 'Tableta' },
    { name: 'PC', description: 'Computadora personal' },
    { name: 'consola', description: 'Consola de videojuegos' },
    { name: 'smartwatch', description: 'Reloj inteligente' },
  ];

  for (const deviceType of deviceTypes) {
    const exists = await deviceTypeRepository.findOne({ where: { name: deviceType.name } });
    if (!exists) {
      await deviceTypeRepository.save(deviceType);
    }
  }

  // Seed Device Brands
  const deviceBrands = [
    { name: 'Apple', description: 'Marca Apple Inc.' },
    { name: 'Samsung', description: 'Samsung Electronics' },
    { name: 'Sony', description: 'Sony Corporation' },
    { name: 'Huawei', description: 'Huawei Technologies' },
    { name: 'Xiaomi', description: 'Xiaomi Corporation' },
    { name: 'LG', description: 'LG Electronics' },
    { name: 'Microsoft', description: 'Microsoft Corporation' },
    { name: 'Nintendo', description: 'Nintendo Co., Ltd.' },
    { name: 'HP', description: 'HP Inc.' },
    { name: 'Dell', description: 'Dell Technologies' },
  ];

  for (const deviceBrand of deviceBrands) {
    const exists = await deviceBrandRepository.findOne({ where: { name: deviceBrand.name } });
    if (!exists) {
      await deviceBrandRepository.save(deviceBrand);
    }
  }

  // Seed Password Types
  const passwordTypes = [
    { name: 'pin', description: 'Código PIN numérico' },
    { name: 'patron', description: 'Patrón de desbloqueo' },
    { name: 'contraseña de texto', description: 'Contraseña alfanumérica' },
    { name: 'no aplica', description: 'Sin contraseña de desbloqueo' },
  ];

  for (const passwordType of passwordTypes) {
    const exists = await passwordTypeRepository.findOne({ where: { name: passwordType.name } });
    if (!exists) {
      await passwordTypeRepository.save(passwordType);
    }
  }

  console.log('Device data seeded successfully');
}