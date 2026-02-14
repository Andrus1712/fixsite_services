import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Article } from "./article.entity";
import { Store } from "./store.entity";

@Entity('inventory')
@Unique(['article', 'store'])
export class Inventory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    article_id: number;

    @ManyToOne(() => Article)
    @JoinColumn({ name: 'article_id' })
    article: Article;

    @Column()
    store_id: number;

    @ManyToOne(() => Store, store => store.id)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column()
    stock: number;

    @Column()
    min_stock: number;
    
    @Column()
    max_stock: number;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;
}