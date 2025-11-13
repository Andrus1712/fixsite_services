import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionService } from './permission.service';
import { Permission } from '../../entities/global/permissions.entity';
import { Modules } from '../../entities/global/modules.entity';
import { Role } from '../../entities/global/role.entity';
import { User } from '../../entities/global/user.entity';
import { Components } from '../../entities/global/components.entity';
import { PermissionController } from './permission.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Modules, Role, User, Components], 'globalConnection'),
    TenantModule
  ],
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule { }