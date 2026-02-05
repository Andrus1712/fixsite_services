import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from './order.entity';

@Entity('technicians')
export class Technician {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  specialty: string;

  @Column()
  level: string;

  @Column({ nullable: true })
  certification: string;

  @OneToMany(() => Order, order => order.technician)
  orders: Order[];
}