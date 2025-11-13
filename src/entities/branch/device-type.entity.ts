import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('device_types')
export class DeviceType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}