import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InventoryAdjustment } from "./inventory-adjustment.entity";
import { Article } from "./article.entity";

@Entity('inventory_adjustment_items')
export class InventoryAdjustmentItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => InventoryAdjustment, adjustment => adjustment.items)
    adjustment: InventoryAdjustment;

    @ManyToOne(() => Article)
    article: Article;

    @Column('int')
    currentQuantity: number;

    @Column('int')
    newQuantity: number;

    @Column('int')
    difference: number; // newQuantity - currentQuantity
}
