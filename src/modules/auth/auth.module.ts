import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt/jwt.strategy';
import { PermissionModule } from '../permission/permission.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantSelectionGuard } from './guards/tenant-selection.guard';
import { FullTokenGuard } from './guards/full-token.guard';

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
