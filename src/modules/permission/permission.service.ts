import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { Permission } from '../../entities/global/permissions.entity';
import { Modules } from '../../entities/global/modules.entity';
import { Role } from '../../entities/global/role.entity';
import { User } from '../../entities/global/user.entity';
import { Components } from '../../entities/global/components.entity';

@Injectable()
export class PermissionService {
    constructor(
        @InjectRepository(Permission, 'globalConnection')
        private permissionRepository: Repository<Permission>,
        @InjectRepository(Modules, 'globalConnection')
        private modulesRepository: Repository<Modules>,
        @InjectRepository(Role, 'globalConnection')
        private roleRepository: Repository<Role>,
        @InjectRepository(User, 'globalConnection')
        private userRepository: Repository<User>,
        @InjectRepository(Components, 'globalConnection')
        private componentsRepository: Repository<Components>,
    ) { }

    async getUserPermissions(userId: string) {
        return this.permissionRepository.find({
            where: { user: { id: userId } },
            relations: ['component'],
        });
    }

    async getUserModules(userId: string) {
        const userPermissions = await this.permissionRepository.find({
            where: { user: { id: userId } },
            relations: ['component', 'component.modules'],
        });

        const componentIds = userPermissions.map(p => p.component.id);

        if (componentIds.length === 0) return [];

        return this.modulesRepository
            .createQueryBuilder('module')
            .leftJoinAndSelect('module.components', 'component')
            .where('module.active = :active', { active: true })
            .andWhere('component.id IN (:...componentIds)', { componentIds })
            .andWhere('component.showMenu = :showMenu', { showMenu: true })
            .andWhere('component.active = :componentActive', { componentActive: true })
            .getMany();
    }

    async create(userId: string, componentId: string, assignedBy: string) {
        const permission = this.permissionRepository.create({
            assignedBy,
        });
        permission.user = { id: userId } as any;
        permission.component = { id: componentId } as any;
        return this.permissionRepository.save(permission);
    }

    async update(id: number, assignedBy: string) {
        return this.permissionRepository.update(id, { assignedBy });
    }

    async getUserRoles(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });
        return user?.roles || [];
    }

    async getRolePermissions(roleIds: string[]) {
        return this.permissionRepository
            .createQueryBuilder('permission')
            .leftJoinAndSelect('permission.component', 'component')
            .leftJoinAndSelect('permission.roles', 'role')
            .where('role.id IN (:...roleIds)', { roleIds })
            .getMany();
    }

    async getRoleModules(roleIds: string[]) {
        const rolePermissions = await this.getRolePermissions(roleIds);
        const componentIds = rolePermissions.map(p => p.component.id);

        if (componentIds.length === 0) return [];

        return this.modulesRepository
            .createQueryBuilder('module')
            .leftJoinAndSelect('module.components', 'component')
            .where('module.active = :active', { active: true })
            .andWhere('component.id IN (:...componentIds)', { componentIds })
            .andWhere('component.showMenu = :showMenu', { showMenu: true })
            .andWhere('component.active = :componentActive', { componentActive: true })
            .getMany();
    }

    async getRoleById(roleId: string) {
        return this.roleRepository.findOne({
            where: { id: roleId },
        });
    }

    async getRoleWithPermissions(roleId: string) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
            relations: ['permissions'],
        });

        if (!role) return null;

        return {
            ...role,
            permissions: role.permissions.map(p => p.id)
        };
    }
    async getAllRoles(page: number = 1, limit: number = 10, filter?: string) {
        const queryBuilder = this.roleRepository.createQueryBuilder('role');

        if (filter) {
            queryBuilder.where('role.name LIKE :filter OR role.description LIKE :filter', {
                filter: `%${filter}%`
            });
        }

        const [roles, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: roles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getavailablePermissions(active: boolean) {
        const permissions = await this.permissionRepository
            .createQueryBuilder('p')
            .select([
                'p.id as permission_id',
                'p.componentId',
                'c.title',
                'c.action',
                'c.option',
                'c.type',
                'c.active',
                'c.showMenu',
                'c.label',
                'm.name as module_name'
            ])
            .innerJoin('components', 'c', 'p.componentId = c.id')
            .innerJoin('module_components', 'mc', 'c.id = mc.componet_id')
            .innerJoin('modules', 'm', 'mc.module_id = m.id')
            .where('c.active = :active', { active })
            .getRawMany();

        return permissions.reduce((acc, permission) => {
            const moduleName = permission.module_name;
            if (!acc[moduleName]) {
                acc[moduleName] = [];
            }
            acc[moduleName].push(permission);
            return acc;
        }, {});
    }

    async createRole(name: string, description: string, permissionIds: number[]) {
        const role = this.roleRepository.create({ name, description });
        const savedRole = await this.roleRepository.save(role);

        if (permissionIds.length > 0) {
            const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });
            savedRole.permissions = permissions;
            await this.roleRepository.save(savedRole);
        }

        return savedRole;
    }

    async updateRole(roleId: string, name: string, description: string, permissionIds: number[]) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
            relations: ['permissions']
        });

        if (!role) return null;

        role.name = name;
        role.description = description;

        const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });
        role.permissions = permissions;

        return this.roleRepository.save(role);
    }

    async deleteRole(roleId: string) {
        return this.roleRepository.delete(roleId);
    }

    // CRUD Modules
    async getAllModules(page: number = 1, limit: number = 10, filter?: string) {
        const queryBuilder = this.modulesRepository.createQueryBuilder('module')
            .leftJoinAndSelect('module.components', 'component');

        if (filter) {
            queryBuilder.where('module.name LIKE :filter OR module.description LIKE :filter', {
                filter: `%${filter}%`
            });
        }

        const [modules, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: modules,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getModuleById(id: string) {
        return this.modulesRepository.findOne({ where: { id }, relations: ['components'] });
    }

    async createModule(name: string, description: string, icon: string) {
        const module = this.modulesRepository.create({ name, description, icon });
        return this.modulesRepository.save(module);
    }

    async updateModule(id: string, name: string, description: string, icon: string) {
        return this.modulesRepository.update(id, { name, description, icon });
    }

    async deleteModule(id: string) {
        return this.modulesRepository.delete(id);
    }

    // CRUD Components
    async getAllComponents(page: number = 1, limit: number = 10, filter?: string) {
        const queryBuilder = this.componentsRepository.createQueryBuilder('component')
            .leftJoinAndSelect('component.modules', 'module');

        if (filter) {
            queryBuilder.where('component.title LIKE :filter OR component.label LIKE :filter', {
                filter: `%${filter}%`
            });
        }

        const [components, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: components,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getComponentById(id: string) {
        return this.componentsRepository.findOne({ where: { id }, relations: ['modules'] });
    }

    async createComponent(moduleIds: string[], componentData: any) {
        const modules = await this.modulesRepository.findBy({ id: In(moduleIds) });
        if (modules.length === 0) return null;

        const component = this.componentsRepository.create({
            ...componentData,
            modules: modules
        });

        return this.componentsRepository.save(component);
    }

    async updateComponent(id: string, moduleIds: string[], componentData: any) {
        const component = await this.componentsRepository.findOne({
            where: { id },
            relations: ['modules']
        });

        if (!component) return null;

        const modules = await this.modulesRepository.findBy({ id: In(moduleIds) });
        if (modules.length === 0) return null;

        Object.assign(component, componentData);
        component.modules = modules;

        return this.componentsRepository.save(component);
    }

    async deleteComponent(id: string) {
        return this.componentsRepository.delete(id);
    }

    // CRUD Permissions
    async getAllPermissions(page: number = 1, limit: number = 10, filter?: string) {
        const queryBuilder = this.permissionRepository.createQueryBuilder('permission')
            .leftJoinAndSelect('permission.component', 'component');

        if (filter) {
            queryBuilder.where('permission.assignedBy LIKE :filter OR component.title LIKE :filter', {
                filter: `%${filter}%`
            });
        }

        const [permissions, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: permissions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getPermissionById(id: number) {
        return this.permissionRepository.findOne({ where: { id }, relations: ['component'] });
    }

    async createPermission(componentId: string, assignedBy: string, key?: string) {
        const component = await this.componentsRepository.findOne({ where: { id: componentId } });
        const permission_key = key || `${component?.option}-${component?.action}`;
        const permission = this.permissionRepository.create({ assignedBy, key: permission_key });
        permission.component = { id: componentId } as any;
        return this.permissionRepository.save(permission);
    }

    async updatePermission(id: number, assignedBy: string) {
        return this.permissionRepository.update(id, { assignedBy });
    }

    async deletePermission(id: number) {
        return this.permissionRepository.delete(id);
    }
}