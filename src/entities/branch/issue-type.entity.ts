import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('issue_types')
export class IssueType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}