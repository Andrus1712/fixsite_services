import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StockTransfer } from "./stock-transfer.entity";
import { Article } from "./article.entity";

@Entity('stock_transfer_items')
export class StockTransferItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => StockTransfer, transfer => transfer.items)
    transfer: StockTransfer;

    @ManyToOne(() => Article)
    article: Article;

    @Column('int')
    quantity: number;
}
