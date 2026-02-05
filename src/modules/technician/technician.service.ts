import { Injectable } from "@nestjs/common";
import { ConnectionDatabaseService } from "src/database/connection-database.service";
import { Technician } from "src/entities/branch";
import { Tenant } from "src/entities/global/tenant.entity";
import { CreateTechnicianDto } from "./dto/create-technician.dto";

@Injectable()
export class TechnicianService {

    constructor(
        private readonly tenantService: ConnectionDatabaseService,
    ) { }

    async getAllTechnicians(tenant: Tenant, page: number = 1, limit: number = 10, filter?: string) {
        const connection = await this.tenantService.getRepository(Technician, tenant);

        const queryBuilder = connection.createQueryBuilder('technician');
        if (filter) {
            queryBuilder.where('technician.name LIKE :filter OR technician.email LIKE :filter OR technician.phone LIKE :filter', {
                filter: `%${filter}%`
            });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOneTechnician(tenant: Tenant, id: string): Promise<Technician | null> {
        const repository = await this.tenantService.getRepository(Technician, tenant);
        return repository.findOne({ where: { id: parseInt(id) } });
    }

    async createTechnician(tenant: Tenant, data: CreateTechnicianDto): Promise<Technician> {
        const repository = await this.tenantService.getRepository(Technician, tenant);
        const entity = repository.create(data);
        return repository.save(entity);
    }

    async updateTechnician(tenant: Tenant, id: string, data: CreateTechnicianDto): Promise<Technician | null> {
        const repository = await this.tenantService.getRepository(Technician, tenant);
        await repository.update(parseInt(id), data);
        return this.findOneTechnician(tenant, id);
    }

    async removeTechnician(tenant: Tenant, id: string): Promise<void> {
        const repository = await this.tenantService.getRepository(Technician, tenant);
        await repository.delete(parseInt(id));
    }
}