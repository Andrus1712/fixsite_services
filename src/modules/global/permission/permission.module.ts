import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionService } from './permission.service';
import { Permission } from 'src/entities/global/permissions.entity';
import { Modules } from 'src/entities/global/modules.entity';
import { Role } from 'src/entities/global/role.entity';
import { User } from 'src/entities/global/user.entity';
import { Components } from 'src/entities/global/components.entity';
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