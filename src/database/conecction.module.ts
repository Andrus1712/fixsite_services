import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionDatabaseService } from './connection-database.service';
import { Tenant } from '../entities/global/tenant.entity';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant], 'globalConnection'),
    ],
    providers: [ConnectionDatabaseService],
    exports: [ConnectionDatabaseService],
})
export class ConnectionModule { }