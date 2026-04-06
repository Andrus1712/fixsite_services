import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/entities/global/tenant.entity';
import { ConnectionModule } from 'src/database/conecction.module';
import { StatsService } from '../inventory/store/stats.service';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [
    ConnectionModule,
    TypeOrmModule.forFeature([Tenant], 'globalConnection'),
  ],
  providers: [StatsService, RealtimeService, RealtimeGateway],
  exports: [RealtimeService],
})
export class RealtimeModule {}
