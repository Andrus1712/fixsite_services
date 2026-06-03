import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Service } from './service.entity';
import { OrderIssue } from './issue.entity';
import { MaterialIssue } from './material-issues.entity';
import { OrderServicePart } from './order-service-part.entity';

@Entity('order_services')
export class OrderService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column()
  service_id: number;

  @ManyToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Service, { nullable: false })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToMany(() => OrderIssue, { nullable: true, eager: false })
  @JoinTable({
    name: 'order_service_issues',
    joinColumn: { name: 'order_service_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'order_issue_id', referencedColumnName: 'id' },
  })
  issues: OrderIssue[];

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true })
  estimated_minutes: number;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  material_issue_id: number;

  @ManyToOne(() => MaterialIssue, { nullable: true })
  @JoinColumn({ name: 'material_issue_id' })
  materialIssue: MaterialIssue;

  @OneToMany(() => OrderServicePart, (osp) => osp.orderService)
  parts: OrderServicePart[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
