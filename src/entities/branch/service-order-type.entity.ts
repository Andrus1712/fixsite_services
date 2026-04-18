import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Service } from './service.entity';
import { OrderType } from './order-type.entity';
import { Issue } from './issue.entity';

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

  @ManyToOne(() => Issue, { nullable: true })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column({ name: 'tiempo_estimado_minutos' })
  tiempoEstimadoMinutos: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
