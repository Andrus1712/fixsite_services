import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { LogEvents, LogStatus, LogType } from "src/entities/branch/log-events.entity";
import { Tenant } from "src/entities/global/tenant.entity";

/**
 * Parámetros para registrar un evento de log en una orden.
 */
export interface LogEventParams {
    /** ID de la orden asociada */
    orderId: number;
    /** Tipo de evento */
    type: LogType;
    /** Título corto del evento */
    title: string;
    /** Descripción detallada (opcional) */
    description?: string;
    /** Nombre del usuario que ejecutó la acción */
    user: string;
    /** Icono representativo (opcional) */
    icon?: string;
    /** Metadata adicional en formato clave-valor */
    metadata?: Record<string, any>;
    /** Nivel del log (default: SUCCESS) */
    status?: LogStatus;
}

@Injectable()
export class LogEventService {
    constructor(
        private readonly connectionService: ConnectionDatabaseService,
    ) { }

    /**
     * Registra un evento de log fuera de una transacción existente.
     * Usa este método cuando NO estás dentro de un transaction block.
     */
    async log(tenant: Tenant, params: LogEventParams): Promise<LogEvents> {
        const connection = await this.connectionService.getConnection(tenant);
        const repo = connection.getRepository(LogEvents);

        const logEvent = new LogEvents();
        logEvent.title = params.title;
        logEvent.description = params.description;
        logEvent.type = params.type;
        logEvent.status = params.status ?? LogStatus.SUCCESS;
        logEvent.user = params.user;
        logEvent.icon = params.icon;
        logEvent.metadata = params.metadata;
        logEvent.order_id = params.orderId;
        logEvent.timestamp = new Date();

        return repo.save(logEvent);
    }

    /**
     * Registra un evento de log DENTRO de una transacción existente.
     * Usa este método cuando ya tienes un EntityManager de transaction/queryRunner.
     */
    async logWithManager(manager: EntityManager, params: LogEventParams): Promise<LogEvents> {
        const logEvent = new LogEvents();
        logEvent.title = params.title;
        logEvent.description = params.description;
        logEvent.type = params.type;
        logEvent.status = params.status ?? LogStatus.SUCCESS;
        logEvent.user = params.user;
        logEvent.icon = params.icon;
        logEvent.metadata = params.metadata;
        logEvent.order_id = params.orderId;
        logEvent.timestamp = new Date();

        return manager.save(LogEvents, logEvent);
    }

    /**
     * Obtiene todos los logs de una orden, ordenados por timestamp DESC.
     */
    async getLogsByOrder(tenant: Tenant, orderId: number): Promise<LogEvents[]> {
        const connection = await this.connectionService.getConnection(tenant);
        const repo = connection.getRepository(LogEvents);

        return repo.find({
            where: { order_id: orderId },
            order: { timestamp: 'DESC' },
        });
    }

    /**
     * Obtiene el timeline de una orden (ordenado ASC para visualización cronológica).
     */
    async getTimeline(tenant: Tenant, orderId: number): Promise<LogEvents[]> {
        const connection = await this.connectionService.getConnection(tenant);
        const repo = connection.getRepository(LogEvents);

        return repo.find({
            where: { order_id: orderId },
            order: { timestamp: 'ASC' },
        });
    }
}
