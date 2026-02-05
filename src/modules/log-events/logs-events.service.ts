import { Injectable } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { LogEvents } from "src/entities/branch";
import { Tenant } from "src/entities/global/tenant.entity";
import { CreateLogEventDto } from "./dto/create-log-event.dto";

@Injectable()
export class LogEventService {
    constructor(
        private readonly connectionService: ConnectionDatabaseService,
    ) { }

    async createLogEvent(tenant: Tenant, createLogEventDto: CreateLogEventDto, user: any): Promise<LogEvents> {
        const tenantConnection = await this.connectionService.getConnection(tenant);
        const logEventRepository = tenantConnection.getRepository(LogEvents);

        const logEvent = logEventRepository.create({
            ...createLogEventDto,
            user: user.name,
            timestamp: new Date()
        });

        return await logEventRepository.save(logEvent);
    }

    async getLogsByOrder(tenant: Tenant, orderId: number): Promise<LogEvents[]> {
        const tenantConnection = await this.connectionService.getConnection(tenant);
        const logEventRepository = tenantConnection.getRepository(LogEvents);

        return await logEventRepository.find({
            where: { order: { id: orderId } },
            order: { timestamp: 'DESC' }
        });
    }


}