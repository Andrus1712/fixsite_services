import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DeviceType } from './device-type.entity';
import { DeviceBrand } from './device-brand.entity';

@Entity('device_models')
export class DeviceModel {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DeviceType)
  @JoinColumn({ name: 'device_type_id' })
  deviceType: DeviceType;

  @Column({ name: 'device_type_id' })
  deviceTypeId: string;

  @ManyToOne(() => DeviceBrand)
  @JoinColumn({ name: 'device_brand_id' })
  deviceBrand: DeviceBrand;

  @Column({ name: 'device_brand_id' })
  deviceBrandId: string;
}