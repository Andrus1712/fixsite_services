import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('device_brands')
export class DeviceBrand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}