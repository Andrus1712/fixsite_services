import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('parts')
export class Part {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  part_id: string;

  @Column()
  part_name: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  cost: number;

  @Column()
  availability: string;

  @Column()
  order_id: number;

  @ManyToOne(() => Order, order => order.parts)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}