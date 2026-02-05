import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  author: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column('text')
  content: string;

  @Column()
  type: string;

  // @Column()
  // order_id: number;

  @ManyToOne(() => Order, order => order.notes)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}