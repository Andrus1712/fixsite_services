import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MaterialIssueItem } from "./material-issue-items.entity";
import { Store } from "./store.entity";

export enum MaterialIssueStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

@Entity('material_issues')
export class MaterialIssue {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Store)
    store: Store;

    @Column({ type: 'enum', enum: MaterialIssueStatus })
    status: MaterialIssueStatus;

    @OneToMany(
        () => MaterialIssueItem,
        item => item.materialIssue,
        { cascade: true },
    )
    items: MaterialIssueItem[];

    @Column()
    createdBy: string;

    @Column({ nullable: true })
    approvedBy?: string;

    @CreateDateColumn()
    createdAt: Date;
}