import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Tenant } from '../../entities/global/tenant.entity';
import { Customer } from '../../entities/branch/customer.entity';

@Injectable()
export class CustomerService {
    constructor(
        private readonly tenantService: ConnectionDatabaseService,
    ) { }

    async create(tenant: Tenant, createCustomerDto: CreateCustomerDto) {
        const connection = await this.tenantService.getConnection(tenant);
        const repo = connection.getRepository(Customer);
        const customer = repo.create(createCustomerDto);
        return await repo.save(customer);
    }

    async findAll(tenant: Tenant, page = 1, limit = 10, filter?: string) {
        const connection = await this.tenantService.getConnection(tenant);
        const repo = connection.getRepository(Customer);
        const skip = (page - 1) * limit;

        const qb = repo.createQueryBuilder('customer');

        if (filter) {
            qb.where(
                '(customer.customer_name LIKE :filter OR customer.customer_email LIKE :filter OR customer.customer_phone LIKE :filter)',
                { filter: `%${filter}%` },
            );
        }

        qb.skip(skip).take(limit).orderBy('customer.id', 'DESC');

        const [items, total] = await qb.getManyAndCount();

        return { items, total };
    }

    async findOne(tenant: Tenant, id: number) {
        const connection = await this.tenantService.getConnection(tenant);
        const repo = connection.getRepository(Customer);
        const customer = await repo.findOne({ where: { id } });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }
        return customer;
    }

    async update(tenant: Tenant, id: number, updateCustomerDto: UpdateCustomerDto) {
        const connection = await this.tenantService.getConnection(tenant);
        const repo = connection.getRepository(Customer);
        const customer = await repo.findOne({ where: { id } });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        Object.assign(customer, updateCustomerDto);
        return await repo.save(customer);
    }

    async remove(tenant: Tenant, id: number) {
        const connection = await this.tenantService.getConnection(tenant);
        const repo = connection.getRepository(Customer);
        const customer = await repo.findOne({ where: { id } });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        return await repo.delete(id);
    }
}
