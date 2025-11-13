import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Modules } from "./modules.entity";

@Entity('components')
export class Components {
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    label: string;

    @Column()
    title: string;

    @Column()
    componentKey: string;

    @Column()
    option: string;

    @Column()
    action: string;

    @Column()
    path: string;

    @Column({ nullable: true })
    icon: string;

    @Column()
    order: number;

    @Column({ default: true })
    showMenu: boolean;

    @Column({ default: true })
    active: boolean;

    @Column({ nullable: true })
    type: string; // G o T

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToMany(() => Modules, (module) => module.components)
    modules: Modules[];

}