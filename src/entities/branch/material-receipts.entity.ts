import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Store } from "./store.entity";
import { PurchaseOrder } from "./purchase-order.entity";
import { MaterialReceiptItem } from "./material-receipt-items.entity";

export enum MaterialReceiptStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

@Entity('material_receipts')
export class MaterialReceipt {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Store)
    store: Store;

    @ManyToOne(() => PurchaseOrder, { nullable: true })
    purchaseOrder?: PurchaseOrder;

    @Column({ type: 'enum', enum: MaterialReceiptStatus })
    status: MaterialReceiptStatus;

    @OneToMany(
        () => MaterialReceiptItem,
        item => item.receipt,
        { cascade: true },
    )
    items: MaterialReceiptItem[];

    @Column()
    createdBy: string;

    @Column({ nullable: true })
    approvedBy?: string;

    @CreateDateColumn()
    createdAt: Date;

}