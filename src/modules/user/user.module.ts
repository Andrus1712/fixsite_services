import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../../entities/global/user.entity';
import { Role } from '../../entities/global/role.entity';
import { Tenant } from '../../entities/global/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Tenant], 'globalConnection'),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}