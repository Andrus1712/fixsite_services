import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request } from 'express';
import { cookieConfig } from '../../../config/cookie.config';
import { UserService } from "src/modules/global/user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private usersService: UserService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return request?.cookies?.[cookieConfig.accessToken.name];
                },
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        this.logger.debug('JWT Strategy - Payload received', { payload, context: 'JwtStrategy' });

        const user = await this.usersService.findOne(payload.sub);

        if (!user) {
            this.logger.warn('JWT Strategy - User not found', { userId: payload.sub, context: 'JwtStrategy' });
            return null;
        }

        const result = {
            ...payload,
            id: user.id,
            name: user.name,
            isActive: user.isActive
        };

        this.logger.debug('JWT Strategy - User validated successfully', { userId: user.id, context: 'JwtStrategy' });
        return result;
    }
}