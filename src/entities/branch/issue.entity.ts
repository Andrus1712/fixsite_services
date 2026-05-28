import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { FailureCode } from './failure-codes.entity';

export enum OrderIssueStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

@Entity('order_issues')
export class OrderIssue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  additional_notes: string;

  @Column('json', { nullable: true })
  attachments: string[];

  @Column('json', { nullable: true })
  steps_to_reproduce: string[];

  @Column({ nullable: true })
  reported_by: string;

  @Column({ type: 'date', nullable: true })
  reported_date: Date;

  // ── Relación con la orden ─────────────────────────────────────────────────

  @Column()
  order_id: number;

  @ManyToOne(() => Order, order => order.issues)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // ── Clasificación mediante FailureCode ────────────────────────────────────

  @Column({ nullable: true })
  failure_code_id: number;

  @ManyToOne(() => FailureCode, { nullable: true, eager: false })
  @JoinColumn({ name: 'failure_code_id' })
  failureCode: FailureCode;

  // ── Estado ────────────────────────────────────────────────────────────────

  @Column({ type: 'bool', default: false })
  is_resolved: boolean;

  @Column({ type: 'enum', enum: OrderIssueStatus, default: OrderIssueStatus.PENDING })
  status: OrderIssueStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
