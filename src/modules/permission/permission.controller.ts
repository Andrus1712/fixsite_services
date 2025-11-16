import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException, Query } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { TenantService } from "../tenant/tenant.service";
import { FullTokenGuard } from "../auth/guards/full-token.guard";

@Controller('permissions')
@UseGuards(FullTokenGuard)
export class PermissionController {

    constructor(private readonly permissionService: PermissionService,
        private readonly tenantService: TenantService
    ) { }

    @Get('by-role')
    async getPermissionsByRole(
        @Query('roleId') roleId: string,
        @Query('userId') userId: string,
        @Request() req
    ) {
        const tenantId = req.user.tenantId || null;
        // const isFullToken = req.user.type === 'full';
        const componentType = tenantId ? 'T' : 'G';

        // Validar que el usuario solo pueda ver sus propios permisos o sea admin
        if (req.user.id !== Number(userId) && !req.user.isAdmin) {
            throw new ForbiddenException('No tienes permisos para ver esta información');
        }

        const userTenants = await this.tenantService.getUserTenats(userId);
        const currentTenant = tenantId ? await this.tenantService.getTenantById(tenantId) : null;

        // Obtener permisos directos del usuario
        const userPermissions = await this.permissionService.getUserPermissions(userId);
        const userModules = await this.permissionService.getUserModules(userId);

        // Obtener permisos del rol específico
        const rolePermissions = await this.permissionService.getRolePermissions([roleId]);
        const roleModules = await this.permissionService.getRoleModules([roleId]);

        // Obtener información del rol
        const role = await this.permissionService.getRoleById(roleId);

        // Obtener roles del usuario
        const userRoles = await this.permissionService.getUserRoles(userId);

        // Combinar permisos (usuario + rol específico)
        const allPermissions = [...userPermissions, ...rolePermissions];
        const allModules = [...userModules, ...roleModules];

        // Filtrar por component type
        const filteredPermissions = allPermissions.filter(p =>
            p.component && p.component.type === componentType
        );
        const filteredModules = allModules.map(m => ({
            ...m,
            components: m.components.filter(c => c.type === componentType && c.showMenu && c.active)
        })).filter(m => m.components.length > 0);

        return {
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
            roles: userRoles.map(role => ({
                id: parseInt(role.id),
                name: role.name,
                description: role.description,
                active: role.active,
                createdAt: role.createdAt.toISOString(),
                updatedAt: role.updatedAt.toISOString(),
            })),
            currentRol: role ? [{
                id: parseInt(role.id),
                name: role.name,
                description: role.description,
                active: role.active,
                createdAt: role.createdAt.toISOString(),
                updatedAt: role.updatedAt.toISOString(),
            }] : [],
            permission: filteredPermissions.map(p => ({
                id: p.id,
                userId: userId,
                componentId: p.component.id,
                assignedBy: p.assignedBy,
                componentKey: p.component.componentKey,
                option: p.component.option,
                action: p.component.action,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                label: p.component.label,
                title: p.component.title,
                path: p.component.path,
                icon: p.component.icon,
                order: p.component.order,
                showMenu: p.component.showMenu,
                active: p.component.active,
                key: p.key
            })),
            modules: filteredModules.map(m => ({
                id: parseInt(m.id),
                label: m.name,
                title: m.name,
                moduleKey: m.name,
                icon: m.icon,
                order: 1,
                active: m.active,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
                components: m.components.map(c => ({
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
            })),
        };
    }

    @Get('byUser/:userId')
    async getPermissionsAll(
        @Param('userId') userId: string,
        @Request() req
    ) {
        const tenantId = req.user.tenantId || null;
        // Validar que el usuario solo pueda ver sus propios permisos o sea admin
        if (req.user.id !== Number(userId) && !req.user.isAdmin) {
            throw new ForbiddenException('No tienes permisos para ver esta información');
        }

        // Obtener permisos directos del usuario
        const userPermissions = await this.permissionService.getUserPermissions(userId);
        const userModules = await this.permissionService.getUserModules(userId);

        // Obtener roles del usuario
        const userRoles = await this.permissionService.getUserRoles(userId);
        const roleIds = userRoles.map(role => role.id);

        // Obtener permisos y módulos por roles
        const rolePermissions = roleIds.length > 0 ? await this.permissionService.getRolePermissions(roleIds) : [];
        const roleModules = roleIds.length > 0 ? await this.permissionService.getRoleModules(roleIds) : [];

        // Combinar permisos (usuario + roles)
        const allPermissions = [...userPermissions, ...rolePermissions];
        const allModules = [...userModules, ...roleModules];

        return {
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
                userId: userId,
                key: p.key,
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
            })),
        };
    }

    @Get('roles/all')
    async getAllRoles(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        return await this.permissionService.getAllRoles(pageNum, limitNum, filter);
    }

    @Get('available')
    async getAllPermissions() {
        return await this.permissionService.getavailablePermissions(true);
    }

    @Get('roles/:id')
    async getRoleById(@Param('id') roleId: string) {
        return await this.permissionService.getRoleWithPermissions(roleId);
    }

    @Post('roles')
    async createRole(@Body() createRoleDto: { name: string; description: string; permissions: number[]; }) {
        const { name, description, permissions } = createRoleDto;
        return await this.permissionService.createRole(name, description, permissions);
    }

    @Put('roles/:id')
    async updateRole(
        @Param('id') roleId: string,
        @Body() updateRoleDto: { name: string; description: string; permissions: number[]; }
    ) {
        const { name, description, permissions } = updateRoleDto;
        return await this.permissionService.updateRole(roleId, name, description, permissions);
    }

    @Delete('roles/:id')
    async deleteRole(@Param('id') roleId: string) {
        return await this.permissionService.deleteRole(roleId);
    }

    // CRUD Modules
    @Get('modules/all')
    async getAllModules(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        return await this.permissionService.getAllModules(pageNum, limitNum, filter);
    }

    @Get('modules/:id')
    async getModuleById(@Param('id') id: string) {
        return await this.permissionService.getModuleById(id);
    }

    @Post('modules')
    async createModule(@Body() createModuleDto: { name: string; description: string; icon: string; }) {
        const { name, description, icon } = createModuleDto;
        return await this.permissionService.createModule(name, description, icon);
    }

    @Put('modules/:id')
    async updateModule(
        @Param('id') id: string,
        @Body() updateModuleDto: { name: string; description: string; icon: string; }
    ) {
        const { name, description, icon } = updateModuleDto;
        return await this.permissionService.updateModule(id, name, description, icon);
    }

    @Delete('modules/:id')
    async deleteModule(@Param('id') id: string) {
        return await this.permissionService.deleteModule(id);
    }

    // CRUD Components
    @Get('components/all')
    async getAllComponents(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        return await this.permissionService.getAllComponents(pageNum, limitNum, filter);
    }

    @Get('components/:id')
    async getComponentById(@Param('id') id: string) {
        return await this.permissionService.getComponentById(id);
    }

    @Post('components')
    async createComponent(@Body() createComponentDto: { moduleIds: string[]; label: string; title: string; componentKey: string; option: string; action: string; path: string; icon?: string; order: number; showMenu?: boolean; type?: string; }) {
        const { moduleIds, ...componentData } = createComponentDto;
        return await this.permissionService.createComponent(moduleIds, componentData);
    }

    @Put('components/:id')
    async updateComponent(
        @Param('id') id: string,
        @Body() updateComponentDto: { moduleIds: string[]; label: string; title: string; componentKey: string; option: string; action: string; path: string; icon?: string; order: number; showMenu?: boolean; type?: string; }
    ) {
        const { moduleIds, ...componentData } = updateComponentDto;
        return await this.permissionService.updateComponent(id, moduleIds, componentData);
    }

    @Delete('components/:id')
    async deleteComponent(@Param('id') id: string) {
        return await this.permissionService.deleteComponent(id);
    }

    // CRUD Permissions
    @Get('all')
    async getAllPermissionsCrud(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('filter') filter?: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        return await this.permissionService.getAllPermissions(pageNum, limitNum, filter);
    }

    @Get(':id')
    async getPermissionById(@Param('id') id: string) {
        return await this.permissionService.getPermissionById(parseInt(id));
    }

    @Post('save')
    async createPermission(@Body() createPermissionDto: { componentId: string; assignedBy: string; }) {
        const { componentId, assignedBy } = createPermissionDto;
        return await this.permissionService.createPermission(componentId, assignedBy);
    }

    @Put(':id')
    async updatePermission(
        @Param('id') id: string,
        @Body() updatePermissionDto: { assignedBy: string; }
    ) {
        const { assignedBy } = updatePermissionDto;
        return await this.permissionService.updatePermission(parseInt(id), assignedBy);
    }

    @Delete(':id')
    async deletePermission(@Param('id') id: string) {
        return await this.permissionService.deletePermission(parseInt(id));
    }
}