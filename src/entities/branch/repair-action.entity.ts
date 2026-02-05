import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FailureCode } from "./failure-codes.entity";

@Entity('repair_actions')
export class RepairAction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => FailureCode, failure => failure.repairActions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'failure_code_id' })
    failureCode: FailureCode;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ name: "estimated_minutes" })
    estimatedMinutes: number;

    @Column({ default: true, name: "requires_parts" })
    requiresParts: boolean;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}