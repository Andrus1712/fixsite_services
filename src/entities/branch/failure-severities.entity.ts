import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FailureCode } from "./failure-codes.entity";

@Entity('failure_severities')
export class FailureSeverity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    priority: number; // 1 = crítica, 4 = baja

    @Column({ nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => FailureCode, failure => failure.severity)
    failureCodes: FailureCode[];
}