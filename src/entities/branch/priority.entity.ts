import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('priorities')
export class Priority {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  level: number;
}