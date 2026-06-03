import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Service } from './service.entity';
import { Article } from './article.entity';

@Entity('service_articles')
@Unique(['service_id', 'article_id'])
export class ServiceArticle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    service_id: number;

    @ManyToOne(() => Service, service => service.serviceArticles, { nullable: false })
    @JoinColumn({ name: 'service_id' })
    service: Service;

    @Column()
    article_id: number;

    @ManyToOne(() => Article, { nullable: false })
    @JoinColumn({ name: 'article_id' })
    article: Article;

    @Column('decimal', { precision: 10, scale: 2 })
    default_quantity: number;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
