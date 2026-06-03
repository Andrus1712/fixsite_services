import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ServiceOrderType } from './service-order-type.entity';
import { ServiceArticle } from './service-article.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  code: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  base_price: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  requires_articles: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ServiceOrderType, sot => sot.service)
  serviceOrderTypes: ServiceOrderType[];

  @OneToMany(() => ServiceArticle, sa => sa.service)
  serviceArticles: ServiceArticle[];
}
