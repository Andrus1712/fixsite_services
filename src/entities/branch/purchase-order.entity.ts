// id
// provider_id
// status (pendiente, recibido, cancelado)
// date
// created_at / updated_at

import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Provider } from "./provider.entity";
import { PurchaseOrderDetail } from "./purchase-order-detail.entity";

export enum PurchaseOrderStatus {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    CLOSED = 'CLOSED',
    CANCELLED = 'CANCELLED',
}

@Entity("purchase_orders")
export class PurchaseOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Provider, provider => provider.id)
    provider_id: Provider;

    @Column({ type: 'enum', enum: PurchaseOrderStatus })
    status: PurchaseOrderStatus;

    @Column()
    date: Date;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    @OneToMany(() =>
        PurchaseOrderDetail,
        purchaseOrderDetail => purchaseOrderDetail.purchase_order_id,
        { cascade: true }
    )
    purchase_order_details: PurchaseOrderDetail[];
}