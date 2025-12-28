import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FailureCode } from "./failure-codes.entity";

@Entity('failure_categories')
export class FailureCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => FailureCode, failure => failure.category)
    failureCodes: FailureCode[];
}