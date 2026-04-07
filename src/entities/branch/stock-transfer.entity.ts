import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Store } from "./store.entity";
import { StockTransferItem } from "./stock-transfer-item.entity";

export enum StockTransferStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

@Entity('stock_transfers')
export class StockTransfer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Store)
    fromStore: Store;

    @ManyToOne(() => Store)
    toStore: Store;

    @Column({ type: 'enum', enum: StockTransferStatus })
    status: StockTransferStatus;

    @OneToMany(() => StockTransferItem, item => item.transfer, { cascade: true })
    items: StockTransferItem[];

    @Column()
    createdBy: string;

    @Column({ nullable: true })
    approvedBy?: string;

    @CreateDateColumn()
    createdAt: Date;
}
