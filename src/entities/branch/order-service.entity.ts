import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Service } from './service.entity';

@Entity('orders_service')
export class OrderService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column()
  service_id: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precio: number;

  @Column({ nullable: true })
  tiempo_estimado_minutos: number;

  @Column('text', { nullable: true })
  notas: string;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Service, { nullable: false })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
