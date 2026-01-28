import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Order } from "./order.entity";

export enum LogType {
    CREATED = "created",
    UPDATED = "updated",
    ASSIGNED = "assigned",
    STATUS_CHANGE = "status_change",
    COMMENT = "comment",
    REPAIR = "repair",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    CUSTOM = "custom"
}

export enum LogStatus {
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error",
    INFO = "info",
    DEFAULT = "default"
}
@Entity('logs_events')
export class LogEvents {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column()
    timestamp: Date;

    @Column({
        type: 'enum',
        enum: LogType,
        default: LogType.CUSTOM
    })
    type: LogType;

    @Column({
        type: 'enum',
        enum: LogStatus,
        nullable: true,
        default: LogStatus.DEFAULT
    })
    status?: LogStatus;

    @Column({ nullable: true })
    user?: string;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Column({ nullable: true })
    icon?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Order, order => order.id, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'order_id' })
    order?: Order;
}