import { Module } from '@nestjs/common';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { PermissionModule } from './permission/permission.module';

@Module({
  imports: [
    TenantModule,
    UserModule,
    PermissionModule,
  ],
  exports: [
    TenantModule,
    UserModule,
    PermissionModule,
  ],
})
export class GlobalModule {}