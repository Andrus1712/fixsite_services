import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DeviceType } from "./device-type.entity";
import { FailureCategory } from "./failure-categories.entity";
import { FailureSeverity } from "./failure-severities.entity";
import { RepairAction } from "./repair-action.entity";

@Entity('failure_codes')
export class FailureCode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @ManyToOne(() => DeviceType, deviceType => deviceType.failureCodes)
    @JoinColumn({ name: 'device_type_id' })
    deviceType: DeviceType;

    @ManyToOne(() => FailureCategory, category => category.failureCodes)
    @JoinColumn({ name: 'category_id' })
    category: FailureCategory;

    @ManyToOne(() => FailureSeverity, severity => severity.failureCodes)
    @JoinColumn({ name: 'severity_id' })
    severity: FailureSeverity;

    @Column({ name: "estimated_repair_minutes" })
    estimatedRepairMinutes: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => RepairAction, action => action.failureCode)
    repairActions: RepairAction[];
}