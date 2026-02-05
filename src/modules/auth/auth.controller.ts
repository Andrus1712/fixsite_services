import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards, ForbiddenException, Res } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { FullTokenGuard } from './guards/full-token.guard';
import { TenantSelectionGuard } from './guards/tenant-selection.guard';
import type { Response } from 'express';
import { cookieConfig } from '../../config/cookie.config';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post("register")
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const user = await this.authService.validateUser(loginDto);
        const result = await this.authService.login(user);
        
        // Establecer cookie de acceso segura
        res.cookie(cookieConfig.accessToken.name, result.accessToken, cookieConfig.accessToken.options);
        
        const { accessToken, ...response } = result;
        return response;
    }

    @Post('select-tenant')
    @UseGuards(FullTokenGuard)
    async selectTenant(
        @Body('tenantId') tenantId: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response
    ) {
        const result = await this.authService.selectTenant(req.user.sub, tenantId);
        
        // Actualizar cookie de acceso con tenant
        res.cookie(cookieConfig.accessToken.name, result.accessToken, cookieConfig.accessToken.options);
        
        const { accessToken, ...response } = result;
        return response;
    }

    @Post('switch-tenant')
    @UseGuards(FullTokenGuard)
    async switchTenant(
        @Body('tenantId') tenantId: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response
    ) {
        const result = await this.authService.selectTenant(req.user.sub, tenantId);
        
        // Actualizar cookie de acceso
        res.cookie(cookieConfig.accessToken.name, result.accessToken, cookieConfig.accessToken.options);
        
        const { accessToken, ...response } = result;
        return response;
    }

    @Post('logout-tenant')
    @UseGuards(FullTokenGuard)
    async logoutTenant(@Request() req, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.logoutTenant(
            req.user.sub, 
            req.user.username, 
            req.user.email
        );
        
        // Actualizar cookie de acceso sin tenant
        res.cookie(cookieConfig.accessToken.name, result.accessToken, cookieConfig.accessToken.options);
        
        const { accessToken, ...response } = result;
        return response;
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie(cookieConfig.accessToken.name);
        
        return {
            message: 'Logout successful'
        };
    }

    @Get('check')
    @UseGuards(FullTokenGuard)
    profile(@Request() req) {
        return {
            user: req.user,
            tenantId: req.user.tenantId
        };
    }
}
