import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Order } from "./order.entity";

export enum LogType {
    // Orden
    ORDER_CREATED = "order_created",
    ORDER_UPDATED = "order_updated",
    ORDER_STATUS_CHANGE = "order_status_change",
    ORDER_ASSIGNED = "order_assigned",
    ORDER_UNASSIGNED = "order_unassigned",
    ORDER_COMPLETED = "order_completed",
    ORDER_CANCELLED = "order_cancelled",
    // Issues (fallas)
    ISSUE_ADDED = "issue_added",
    ISSUE_UPDATED = "issue_updated",
    ISSUE_DELETED = "issue_deleted",
    ISSUE_RESOLVED = "issue_resolved",
    ISSUE_REJECTED = "issue_rejected",
    ISSUE_REOPENED = "issue_reopened",
    // Servicios
    SERVICE_ADDED = "service_added",
    SERVICE_UPDATED = "service_updated",
    SERVICE_REMOVED = "service_removed",
    // Notas
    NOTE_ADDED = "note_added",
    // Dispositivos
    DEVICE_ADDED = "device_added",
    // Genérico
    COMMENT = "comment",
    CUSTOM = "custom",
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

    @Column({ nullable: true })
    order_id?: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Order, order => order.logs, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'order_id' })
    order?: Order;
}