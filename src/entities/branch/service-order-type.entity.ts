import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { OrderType } from './order-type.entity';
import { FailureCode } from './failure-codes.entity';

@Entity('service_order_types')
export class ServiceOrderType {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Service, service => service.serviceOrderTypes)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => OrderType, orderType => orderType.serviceOrderTypes)
  @JoinColumn({ name: 'order_type_id' })
  orderType: OrderType;

  @ManyToOne(() => FailureCode, { nullable: true })
  @JoinColumn({ name: 'failure_code_id' })
  failureCode: FailureCode;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'estimated_minutes' })
  estimatedMinutes: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
