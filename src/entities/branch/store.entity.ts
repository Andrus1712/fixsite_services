// id
// name
// type (bodega, taller, sucursal, movil)
// active
// created_at / updated_at

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Inventory } from "./inventory.entity";

@Entity("stores")
export class Store {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    type: string;

    @Column({ default: true })
    active: boolean;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    created_at: Date;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updated_at: Date;

    @OneToMany(() => Inventory, inventory => inventory.store)
    inventory: Inventory[];
}