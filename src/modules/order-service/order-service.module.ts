import { Module } from '@nestjs/common';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';
import { LogEventsModule } from '../log-events/log-events.module';
import { ServiceArticleModule } from '../service-article/service-article.module';
import { InventoryCoreModule } from '../inventory/inventory-core/inventory-core.module';

@Module({
  imports: [LogEventsModule, ServiceArticleModule, InventoryCoreModule],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
  exports: [OrderServiceService],
})
export class OrderServiceModule { }
