import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, In, BeforeInsert, DataSource } from 'typeorm';
import { Customer } from './customer.entity';
import { Technician } from './technician.entity';
import { Device } from './device.entity';
import { Issue } from './issue.entity';
import { Part } from './part.entity';
import { StatusHistory } from './status-history.entity';
import { Note } from './note.entity';
import { LogEvents } from './log-events.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_code: string;

  @Column('text')
  description: string;

  @Column()
  status: number;

  @Column()
  status_description: string;

  @Column()
  priority: number;

  @Column()
  priority_description: string;

  @Column()
  customer_id: number;

  @Column({ nullable: true })
  assigned_technician_id: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimated_cost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actual_cost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  labor_cost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  parts_cost: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: false })
  cost_approved: boolean;

  @Column({ type: 'date', nullable: true })
  quote_valid_until: Date;

  @Column({ type: 'date', nullable: true })
  estimated_completion: Date;

  @Column({ type: 'date', nullable: true })
  actual_completion: Date;

  @Column({ nullable: true })
  estimated_hours: number;

  @Column({ nullable: true })
  actual_hours: number;

  @Column({ type: 'date', nullable: true })
  sla_deadline: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Technician)
  @JoinColumn({ name: 'assigned_technician_id' })
  technician: Technician;

  @OneToMany(() => Device, device => device.order)
  devices: Device[];

  @OneToMany(() => Issue, issue => issue.order)
  issues: Issue[];

  @OneToMany(() => Part, part => part.order)
  parts: Part[];

  @OneToMany(() => StatusHistory, history => history.order)
  status_history: StatusHistory[];

  @OneToMany(() => Note, note => note.order)
  notes: Note[];

  @OneToMany(() => LogEvents, log => log.order)
  logs: LogEvents[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}