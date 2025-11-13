import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  issue_name: string;

  @Column('text')
  issue_description: string;

  @Column()
  issue_type: number;

  @Column()
  issue_type_description: string;

  @Column()
  issue_severity: number;

  @Column()
  issue_severity_description: string;

  @Column()
  issue_reproducibility: number;

  @Column()
  issue_reproducibility_description: string;

  @Column()
  issue_frequency: number;

  @Column()
  issue_frequency_description: string;

  @Column()
  issue_impact: number;

  @Column()
  issue_impact_description: string;

  @Column()
  issue_difficulty: number;

  @Column()
  issue_difficulty_description: string;

  @Column()
  issue_priority: number;

  @Column()
  issue_priority_description: string;

  @Column()
  issue_urgency: number;

  @Column()
  issue_urgency_description: string;

  @Column()
  issue_detection: number;

  @Column()
  issue_detection_description: string;

  @Column()
  issue_reported_by: string;

  @Column({ type: 'date' })
  issue_reported_date: Date;

  @Column()
  issue_reported_time: string;

  @Column('text', { nullable: true })
  issue_additional_info: string;

  @Column('json', { nullable: true })
  issue_screenshots: string[];

  @Column('json', { nullable: true })
  issue_videos: string[];

  @Column('json', { nullable: true })
  issue_logs: string[];

  @Column('json', { nullable: true })
  issue_attachments: string[];

  @Column('json', { nullable: true })
  issue_steps_to_reproduce: string[];

  @Column('text', { nullable: true })
  issue_environment: string;

  @Column('text', { nullable: true })
  issue_additional_notes: string;

  @Column('json', { nullable: true })
  issue_tags: string[];

  @Column('json', { nullable: true })
  issue_custom_fields: object;

  @Column('json', { nullable: true })
  issue_related_orders: string[];

  @Column()
  order_id: number;

  @ManyToOne(() => Order, order => order.issues)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}