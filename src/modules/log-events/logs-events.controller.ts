import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
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
        @Body() body: CreateLogEventDto,
    ) {
        const data = await this.logEventService.log(tenant, {
            orderId: body.order_id,
            type: body.type,
            title: body.title,
            description: body.description,
            icon: body.icon,
            metadata: body.metadata,
            status: body.status,
            user: user.name,
        });

        return {
            success: true,
            status: HttpStatus.CREATED,
            message: "Registro creado exitosamente",
            data,
            errors: null,
        };
    }

    @Get("/order/:order_id")
    async getLogsByOrder(
        @CurrentTenant() tenant: Tenant,
        @Param('order_id', ParseIntPipe) orderId: number,
    ) {
        const data = await this.logEventService.getLogsByOrder(tenant, orderId);

        return {
            success: true,
            status: HttpStatus.OK,
            message: "Registros consultados exitosamente",
            data,
            errors: null,
        };
    }

    @Get("/timeline/:order_id")
    async getTimeline(
        @CurrentTenant() tenant: Tenant,
        @Param('order_id', ParseIntPipe) orderId: number,
    ) {
        const data = await this.logEventService.getTimeline(tenant, orderId);

        return {
            success: true,
            status: HttpStatus.OK,
            message: "Timeline consultado exitosamente",
            data,
            errors: null,
        };
    }
}
