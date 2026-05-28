import { Module } from '@nestjs/common';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';
import { LogEventsModule } from '../log-events/log-events.module';

@Module({
  imports: [LogEventsModule],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
  exports: [OrderServiceService],
})
export class OrderServiceModule { }
