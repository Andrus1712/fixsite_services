import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('order_statuses')
export class OrderStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}