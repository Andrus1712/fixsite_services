import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ArticleCategory } from "./article-category.entity";
import { ArticleBrand } from "./article-brand.entity";
import { Inventory } from "./inventory.entity";
import { PurchaseOrderDetail } from "./purchase-order-detail.entity";

@Entity("articles")
export class Article {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    sku: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    category_id: number;

    @ManyToOne(() => ArticleCategory)
    @JoinColumn({ name: 'category_id' })
    category: ArticleCategory;

    @Column()
    brand_id: number;

    @ManyToOne(() => ArticleBrand)
    @JoinColumn({ name: 'brand_id' })
    brand: ArticleBrand;

    @Column()
    unit_measurement: string;

    @Column({ default: true })
    active: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @OneToMany(() => Inventory, inventory => inventory.article)
    inventorys: Inventory[];

    @OneToMany(() => PurchaseOrderDetail, purchaseOrderDetail => purchaseOrderDetail.article)
    purchase_orders_details: PurchaseOrderDetail[];
}