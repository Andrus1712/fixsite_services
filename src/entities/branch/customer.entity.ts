import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from './order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customer_name: string;

  @Column()
  customer_email: string;

  @Column()
  customer_phone: string;

  @Column()
  customer_address: string;

  @Column()
  customer_city: string;

  @Column()
  customer_country: string;

  @Column()
  customer_type: string;

  @Column()
  preferred_contact: string;

  @OneToMany(() => Order, order => order.customer)
  orders: Order[];
}