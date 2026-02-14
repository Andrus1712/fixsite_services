export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
}

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Article } from "./article.entity";
import { Store } from "./store.entity";

@Entity("movements")
export class Movement {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    article_id: number;

    @ManyToOne(() => Article)
    @JoinColumn({ name: 'article_id' })
    article: Article;

    @Column()
    store_id: number;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ type: 'enum', enum: MovementType })
    type: MovementType;

    @Column()
    quantity: number;

    @Column()
    referenceType: string; // MATERIAL_RECEIPT, MATERIAL_ISSUE

    @Column()
    reference_id: number;

    @Column()
    user_id: string;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

}