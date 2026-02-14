// id
// name
// contact_info
// created_at / updated_at

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PurchaseOrder } from "./purchase-order.entity";

@Entity("providers")
export class Provider {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    contact_info: string;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    @OneToMany(() => PurchaseOrder, purchaseOrder => purchaseOrder.provider_id)
    purchaseOrders: PurchaseOrder[];
}