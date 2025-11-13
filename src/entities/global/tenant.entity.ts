import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('identity')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ name: 'database_name', unique: true })
  databaseName: string;

  @Column({ name: 'db_host' })
  dbHost: string;

  @Column({ name: 'db_port' })
  dbPort: number;

  @Column({ name: 'db_username' })
  dbUsername: string;

  @Column({ name: 'db_password' })
  dbPassword: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => User, (user) => user.tenants)
  users: User[];
}