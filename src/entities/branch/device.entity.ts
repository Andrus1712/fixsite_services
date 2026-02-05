import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { DeviceModel } from './device-model.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  device_name: string;

  @Column({ nullable: true })
  device_model: number;

  @Column()
  serial_number: string;

  @Column({ nullable: true })
  imei: string;

  @Column({ nullable: true })
  model_year: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  storage_capacity: string;

  @Column()
  order_id: number;

  @ManyToOne(() => Order, order => order.devices)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => DeviceModel, { nullable: true })
  @JoinColumn({ name: 'device_model' })
  deviceModel?: DeviceModel;
}