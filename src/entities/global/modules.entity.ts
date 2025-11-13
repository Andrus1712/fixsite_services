import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Components } from "./components.entity";

@Entity('modules')
export class Modules {
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    active: boolean;

    @Column()
    icon: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToMany(() => Components, (component) => component.modules)
    @JoinTable({
        name: 'module_components', // nombre de la tabla intermedia
        joinColumn: { name: 'module_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'componet_id', referencedColumnName: 'id' },
    })
    components: Components[];
}