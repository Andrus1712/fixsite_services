import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { TempTokenGuard } from './guards/temp-token.guard';
import { FullTokenGuard } from './guards/full-token.guard';
import { TenantSelectionGuard } from './guards/tenant-selection.guard';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post("register")
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto);
        return this.authService.login(user);
    }

    @Post('select-tenant')
    @UseGuards(TenantSelectionGuard)
    async selectTenant(
        @Body('tenantId') tenantId: string,
        @Request() req
    ) {
        return this.authService.selectTenant(req.user.sub, tenantId);
    }

    @Post('switch-tenant')
    @UseGuards(FullTokenGuard)
    async switchTenant(
        @Body('tenantId') tenantId: string,
        @Request() req
    ) {
        return this.authService.selectTenant(req.user.sub, tenantId);
    }

    @Post('logout-tenant')
    @UseGuards(FullTokenGuard)
    async logoutTenant(@Request() req) {
        return this.authService.logoutTenant(
            req.user.sub, 
            req.user.username, 
            req.user.email
        );
    }

    @Get('profile')
    @UseGuards(FullTokenGuard)
    profile(@Request() req) {
        return {
            user: req.user,
            tenantId: req.user.tenantId
        };
    }
}
