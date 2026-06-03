import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { OrderService } from './order-service.entity';
import { Article } from './article.entity';
import { Store } from './store.entity';

@Entity('order_service_parts')
export class OrderServicePart {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    order_service_id: number;

    @ManyToOne(() => OrderService, (os) => os.parts, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_service_id' })
    orderService: OrderService;

    @Column()
    article_id: number;

    @ManyToOne(() => Article, { nullable: false })
    @JoinColumn({ name: 'article_id' })
    article: Article;

    @Column('int')
    quantity: number;

    @Column()
    store_id: number;

    @ManyToOne(() => Store, { nullable: false })
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
