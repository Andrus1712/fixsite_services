import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('status_history')
export class StatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column()
  changed_by: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column()
  order_id: number;

  @ManyToOne(() => Order, order => order.status_history)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}