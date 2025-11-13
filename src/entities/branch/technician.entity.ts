import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from './order.entity';

@Entity('technicians')
export class Technician {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  assigned_technician_name: string;

  @Column()
  assigned_technician_email: string;

  @Column()
  assigned_technician_phone: string;

  @Column()
  assigned_technician_specialty: string;

  @Column()
  technician_level: string;

  @Column({ nullable: true })
  certification: string;

  @OneToMany(() => Order, order => order.technician)
  orders: Order[];
}