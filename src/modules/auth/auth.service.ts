import { BadRequestException, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import * as bcryptjs from "bcryptjs";
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { PermissionService } from '../permission/permission.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly permissionService: PermissionService,
        private readonly tenantService: TenantService,
    ) { }

    async register({ password, email, name }: RegisterDto) {
        const user = await this.userService.findOneByEmail(email);

        if (user) {
            throw new BadRequestException("Email already exists");
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        await this.userService.create({
            name,
            email,
            password: hashedPassword,
        });

        return {
            message: "User created successfully",
        };
    }

    async validateUser({ username, password }: LoginDto) {
        const user = await this.userService.findOneByUsername(username);

        if (!user) {
            throw new UnauthorizedException("Invalid email");
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid password");
        }

        const { password: passwordUser, ...result } = user;

        return result;
    }

    async login(user: any) {

        // Obtener tenants disponibles para el usuario
        const userTenants = await this.tenantService.getUserTenats(user.id);

        // Obtener permisos y datos completos para el tenant seleccionado
        const userPermissions = await this.permissionService.getUserPermissions(user.id);
        const userModules = await this.permissionService.getUserModules(user.id);
        const userRoles = await this.permissionService.getUserRoles(user.id);
        const roleIds = userRoles.map(role => role.id);

        const rolePermissions = roleIds.length > 0 ? await this.permissionService.getRolePermissions(roleIds) : [];
        const roleModules = roleIds.length > 0 ? await this.permissionService.getRoleModules(roleIds) : [];

        const allPermissions = [...userPermissions, ...rolePermissions];
        const allModules = [...userModules, ...roleModules];

        // Generar token temporal (sin tenant específico)
        const tempPayload = {
            username: user.username,
            sub: user.id,
            email: user.email,
            type: 'temp'
        };

        const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '15m' });


        return {
            _token: tempToken,
            user,
            tenants: userTenants.map(t => ({
                id: t.id,
                name: t.name,
                subdomain: t.subdomain
            })),
            roles: userRoles.map(role => ({
                id: parseInt(role.id),
                name: role.name,
                description: role.description,
                active: role.active,
                createdAt: role.createdAt.toISOString(),
                updatedAt: role.updatedAt.toISOString(),
            })),
            permission: allPermissions.map(p => ({
                id: p.id,
                userId: user?.id,
                componentId: p.component.id,
                assignedBy: p.assignedBy,
                componentKey: p.component.componentKey,
                option: p.component.option,
                action: p.component.action,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
            })),
            modules: allModules.map(m => ({
                id: parseInt(m.id),
                label: m.name,
                title: m.name,
                moduleKey: m.name,
                icon: m.icon,
                order: 1,
                active: m.active,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
                components: m.components.filter(c => c.showMenu && c.active).map(c => ({
                    id: parseInt(c.id),
                    label: c.label,
                    title: c.title,
                    componentKey: c.componentKey,
                    option: c.option,
                    action: c.action,
                    path: c.path,
                    icon: c.icon,
                    order: c.order,
                    showMenu: c.showMenu,
                    active: c.active,
                    createdAt: c.createdAt.toISOString(),
                    updatedAt: c.updatedAt.toISOString(),
                })),
            }))
        };
    }

    async selectTenant(userId: string, tenantId: string) {
        // Validar que el usuario tiene acceso al tenant
        const userTenants = await this.tenantService.getUserTenats(userId.toString());

        const hasAccess = userTenants.some(t => parseInt(t.id) === parseInt(tenantId));

        if (!hasAccess) {
            throw new UnauthorizedException('No tienes acceso a este tenant');
        }

        const user = await this.userService.findOne(userId.toString());

        const currentTenant = tenantId ? await this.tenantService.getTenantById(tenantId) : null;

        // Obtener permisos y datos completos para el tenant seleccionado
        // const userPermissions = await this.permissionService.getUserPermissions(userId.toString());
        // const userModules = await this.permissionService.getUserModules(userId.toString());
        // const userRoles = await this.permissionService.getUserRoles(userId.toString());
        // const roleIds = userRoles.map(role => role.id);

        // const rolePermissions = roleIds.length > 0 ? await this.permissionService.getRolePermissions(roleIds) : [];
        // const roleModules = roleIds.length > 0 ? await this.permissionService.getRoleModules(roleIds) : [];

        // const allPermissions = [...userPermissions, ...rolePermissions];
        // const allModules = [...userModules, ...roleModules];

        // Generar token final con tenant incluido
        const finalPayload = {
            username: user?.username,
            sub: user?.id,
            email: user?.email,
            tenantId,
            type: 'full'
        };

        const finalToken = this.jwtService.sign(finalPayload, { expiresIn: '24h' });

        return {
            _token: finalToken,
            user,
            tenants: userTenants.map(t => ({
                id: t.id,
                name: t.name,
                subdomain: t.subdomain,
                databaseName: t.databaseName,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            })),
            currentTenant: currentTenant ? [{
                id: currentTenant.id,
                name: currentTenant.name,
                subdomain: currentTenant.subdomain,
                databaseName: currentTenant.databaseName,
                createdAt: currentTenant.createdAt,
                updatedAt: currentTenant.updatedAt,
            }] : [],
            // roles: userRoles.map(role => ({
            //     id: parseInt(role.id),
            //     name: role.name,
            //     description: role.description,
            //     active: role.active,
            //     createdAt: role.createdAt.toISOString(),
            //     updatedAt: role.updatedAt.toISOString(),
            // })),
            // permission: allPermissions.map(p => ({
            //     id: p.id,
            //     userId: user?.id,
            //     componentId: p.component.id,
            //     assignedBy: p.assignedBy,
            //     componentKey: p.component.componentKey,
            //     option: p.component.option,
            //     action: p.component.action,
            //     createdAt: p.createdAt.toISOString(),
            //     updatedAt: p.updatedAt.toISOString(),
            // })),
            // modules: allModules.map(m => ({
            //     id: parseInt(m.id),
            //     label: m.name,
            //     title: m.name,
            //     moduleKey: m.name,
            //     icon: m.icon,
            //     order: 1,
            //     active: m.active,
            //     createdAt: m.createdAt.toISOString(),
            //     updatedAt: m.updatedAt.toISOString(),
            //     components: m.components.filter(c => c.showMenu && c.active).map(c => ({
            //         id: parseInt(c.id),
            //         label: c.label,
            //         title: c.title,
            //         componentKey: c.componentKey,
            //         option: c.option,
            //         action: c.action,
            //         path: c.path,
            //         icon: c.icon,
            //         order: c.order,
            //         showMenu: c.showMenu,
            //         active: c.active,
            //         createdAt: c.createdAt.toISOString(),
            //         updatedAt: c.updatedAt.toISOString(),
            //     })),
            // }))
        };
    }

    async logoutTenant(userId: number, username: string, email: string) {
        // Obtener tenants disponibles para el usuario
        const userTenants = await this.tenantService.getUserTenats(userId.toString());
        
        // Generar token temporal (sin tenant específico)
        const tempPayload = { 
            username, 
            sub: userId, 
            email,
            type: 'temp' 
        };
        
        const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '15m' });
        
        return {
            tempToken,
            user: {
                id: userId,
                username,
                email
            },
            tenants: userTenants.map(t => ({
                id: t.id,
                name: t.name,
                subdomain: t.subdomain
            }))
        };
    }
}

interface LoginResponse {
    _token: string,
    user: {
        id: number,
        name: string,
        username: string,
        email: string,
        isActive: boolean,
        createdAt: string,
        updatedAt: string;
    },
    permission: [{
        id: number,
        userId: number,
        componentId: number,
        assignedBy: string,
        componentKey: string,
        option: string,
        action: string,
        createdAt: string,
        updatedAt: string,
    }],
    modules: [{
        id: number,
        label: string,
        title: string,
        moduleKey: string,
        icon: string,
        order: number,
        active: boolean,
        createdAt: string,
        updatedAt: string,
        components: [{
            id: number,
            label: string,
            title: string,
            componentKey: string,
            option: string,
            action: string,
            path: string,
            icon: string,
            order: number,
            showMenu: boolean,
            active: boolean,
            createdAt: string,
            updatedAt: string,
        }];
    }];
}