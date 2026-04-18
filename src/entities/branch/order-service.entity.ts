import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinColumn, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Service } from './service.entity';
import { OrderIssue } from './issue.entity';

@Entity('orders_service')
export class OrderService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column()
  service_id: number;

  @ManyToMany(() => OrderIssue, { nullable: true, eager: false })
  @JoinTable({
    name: 'order_service_issues',
    joinColumn: { name: 'order_service_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'order_issue_id', referencedColumnName: 'id' },
  })
  issues: OrderIssue[];

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precio: number;

  @Column({ nullable: true })
  tiempo_estimado_minutos: number;

  @Column('text', { nullable: true })
  notas: string;

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
