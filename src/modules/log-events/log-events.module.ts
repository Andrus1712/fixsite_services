import { Module } from "@nestjs/common";
import { LogEventsController } from "./logs-events.controller";
import { LogEventService } from "./logs-events.service";

@Module({
    imports: [],
    controllers: [LogEventsController],
    providers: [LogEventService],
    exports: [LogEventService]
})
export class LogEventsModule { }