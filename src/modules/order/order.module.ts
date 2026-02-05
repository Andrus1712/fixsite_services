import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { LogEventService } from '../log-events/logs-events.service';
@Module({
  imports: [],
  controllers: [OrderController],
  providers: [OrderService, LogEventService],
  exports: [OrderService],
})
export class OrderModule { }