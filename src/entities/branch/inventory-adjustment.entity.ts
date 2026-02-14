import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Store } from "./store.entity";
import { InventoryAdjustmentItem } from "./inventory-adjustment-item.entity";

export enum InventoryAdjustmentStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('inventory_adjustments')
export class InventoryAdjustment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Store)
    store: Store;

    @Column('text')
    reason: string;

    @Column({ type: 'enum', enum: InventoryAdjustmentStatus })
    status: InventoryAdjustmentStatus;

    @OneToMany(() => InventoryAdjustmentItem, item => item.adjustment, { cascade: true })
    items: InventoryAdjustmentItem[];

    @Column()
    createdBy: string;

    @Column({ nullable: true })
    approvedBy?: string;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt: Date;
}
