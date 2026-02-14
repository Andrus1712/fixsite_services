import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MaterialReceipt } from "./material-receipts.entity";
import { Article } from "./article.entity";

@Entity('material_receipt_items')
export class MaterialReceiptItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MaterialReceipt, receipt => receipt.items)
    receipt: MaterialReceipt;

    @ManyToOne(() => Article)
    article: Article;

    @Column('int')
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    unitCost: number;
}