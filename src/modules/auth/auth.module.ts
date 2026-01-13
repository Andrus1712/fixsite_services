import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt/jwt.strategy';
import { TenantSelectionGuard } from './guards/tenant-selection.guard';
import { FullTokenGuard } from './guards/full-token.guard';
import { UserModule } from '../global/user/user.module';
import { PermissionModule } from '../global/permission/permission.module';
import { TenantModule } from '../global/tenant/tenant.module';

@Module({
    imports: [
        UserModule,
        ConfigModule,
        PassportModule,
        PermissionModule,
        TenantModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, TenantSelectionGuard, FullTokenGuard],
    exports: [TenantSelectionGuard, FullTokenGuard]
})
export class AuthModule { }
