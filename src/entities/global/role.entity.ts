import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permissions.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToMany(() => User, (user) => user.roles)
    users: User[];

    @ManyToMany(() => Permission, (permission) => permission.roles)
    permissions: Permission[];
}