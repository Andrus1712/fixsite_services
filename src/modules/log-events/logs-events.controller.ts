import { Body, Controller, Get, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { TenantSelectionGuard } from "../auth/guards/tenant-selection.guard";
import { CurrentTenant } from "src/common/decorators/current-tenant.decorator";
import { Tenant } from "src/entities/global/tenant.entity";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { CreateLogEventDto } from "./dto/create-log-event.dto";
import { LogEventService } from "./logs-events.service";

@Controller('log-events')
@UseGuards(TenantSelectionGuard)
export class LogEventsController {
    constructor(
        private readonly logEventService: LogEventService,
    ) { }

    @Post("/create")
    async registerLogEvent(
        @CurrentTenant() tenant: Tenant,
        @CurrentUser() user: any,
        @Body() body: CreateLogEventDto
    ) {
        const data = await this.logEventService.createLogEvent(tenant, body, user);

        return {
            success: true,
            statusCode: HttpStatus.CREATED,
            message: "Registro creado exitosamente",
            data: data,
            errors: null
        };
    }

    @Get(":order_id")
    async getLogsByOrder(
        @CurrentTenant() tenant: Tenant,
        @Param('order_id') orderId: number
    ) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const data = await this.logEventService.getLogsByOrder(tenant, orderId);

        return {
            success: true,
            statusCode: HttpStatus.OK,
            message: "Registros consultados exitosamente",
            data: data,
            errors: null
        };
    }
}