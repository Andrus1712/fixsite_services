import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Components } from './components.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    assignedBy: string;

    @Column({nullable: true})
    key: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    userId: number;
    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Components)
    @JoinColumn({ name: 'componentId' })
    component: Components;

    @ManyToMany(() => Role, (role) => role.permissions)
    @JoinTable({
        name: 'permission_roles',
        joinColumn: { name: 'permission_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: Role[];
}