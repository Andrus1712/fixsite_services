import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MaterialIssue } from "./material-issues.entity";
import { Article } from "./article.entity";
import { Order } from "./order.entity";

@Entity('material_issue_items')
export class MaterialIssueItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MaterialIssue, issue => issue.items)
    materialIssue: MaterialIssue;

    @ManyToOne(() => Article)
    article: Article;

    @Column('int')
    quantity: number;

    @ManyToOne(() => Order, order => order.material_issue_items, { nullable: true })
    destinationReference: string; // service_order, disposal, transfer
}
