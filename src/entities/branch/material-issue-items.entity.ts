import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MaterialIssue } from "./material-issues.entity";
import { Article } from "./article.entity";

@Entity('material_issue_items')
export class MaterialIssueItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MaterialIssue, issue => issue.items)
    issue: MaterialIssue;

    @ManyToOne(() => Article)
    article: Article;

    @Column('int')
    quantity: number;

    @Column({ nullable: true })
    destinationReference: string; // service_order, disposal, transfer
}
