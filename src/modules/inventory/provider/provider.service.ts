import { Injectable, NotFoundException } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { Provider } from "src/entities/branch/provider.entity";
import { Tenant } from "src/entities/global/tenant.entity";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { UpdateProviderDto } from "./dto/update-provider.dto";

@Injectable()
export class ProviderService {
    constructor(private readonly tenantService: ConnectionDatabaseService) { }

    async findAll(tenant: Tenant, page: number, limit: number, filter?: string) {
        const repository = await this.tenantService.getRepository(Provider, tenant);

        const queryBuilder = repository.createQueryBuilder('providers');
        if (filter) {
            queryBuilder.where('providers.name LIKE :filter', { filter: `%${filter}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(tenant: Tenant, id: number) {
        const repository = await this.tenantService.getRepository(Provider, tenant);
        const provider = await repository.findOne({ where: { id } });

        if (!provider) {
            throw new NotFoundException('Proveedor no encontrado');
        }

        return provider;
    }

    async create(tenant: Tenant, dto: CreateProviderDto) {
        const repository = await this.tenantService.getRepository(Provider, tenant);
        const entity = repository.create({
            ...dto,
            created_at: new Date(),
            updated_at: new Date()
        });
        return repository.save(entity);
    }

    async update(tenant: Tenant, id: number, dto: UpdateProviderDto) {
        const repository = await this.tenantService.getRepository(Provider, tenant);
        await repository.update(id, { ...dto, updated_at: new Date() });
        return this.findOne(tenant, id);
    }

    async delete(tenant: Tenant, id: number) {
        const provider = await this.findOne(tenant, id);
        const repository = await this.tenantService.getRepository(Provider, tenant);
        await repository.delete(id);
        return provider;
    }
}
