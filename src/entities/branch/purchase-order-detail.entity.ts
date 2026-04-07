// id
// purchase_order_id
// article_id
// quantity
// unit_price
// created_at / updated_at

import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Article } from "./article.entity";
import { PurchaseOrder } from "./purchase-order.entity";

@Entity('purchase_order_details')
export class PurchaseOrderDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    purchase_order_id: number;

    @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.id)
    purchaseOrder: PurchaseOrder;

    @Column()
    article_id: number;

    @ManyToOne(() => Article, article => article.id)
    article: Article;

    @Column()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    unitCost: number;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;
}