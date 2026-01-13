import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from 'src/entities/global/user.entity';
import { Role } from 'src/entities/global/role.entity';
import { Tenant } from 'src/entities/global/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Tenant], 'globalConnection'),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}