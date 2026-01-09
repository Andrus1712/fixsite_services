import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  device_name: string;

  @Column()
  device_type: number;

  @Column()
  device_model: string;

  @Column()
  device_type_description: string;

  @Column()
  device_brand: number;

  @Column()
  device_brand_type: string;

  @Column()
  serial_number: string;

  @Column({ nullable: true })
  imei: string;

  @Column()
  model_year: string;

  @Column()
  color: string;

  @Column()
  storage_capacity: string;

  @Column()
  order_id: number;

  @ManyToOne(() => Order, order => order.devices)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}