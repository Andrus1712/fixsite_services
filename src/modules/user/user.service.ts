import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../entities/global/user.entity';
import { Role } from '../../entities/global/role.entity';
import { Tenant } from '../../entities/global/tenant.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'globalConnection')
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role, 'globalConnection')
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Tenant, 'globalConnection')
    private readonly tenantRepository: Repository<Tenant>,
  ) { }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getAllUsers(page: number = 1, limit: number = 10, filter?: string) {
    const queryBuilder = this.userRepository.createQueryBuilder('users');

    if (filter) {
      queryBuilder.where('users.name LIKE :filter OR users.description LIKE :filter', {
        filter: `%${filter}%`
      });
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { roleIds, tenantIds, ...userData } = createUserDto;
    
    const user = this.userRepository.create(userData);
    
    if (roleIds?.length) {
      user.roles = await this.roleRepository.findBy({ id: In(roleIds) });
    }
    
    if (tenantIds?.length) {
      user.tenants = await this.tenantRepository.findBy({ id: In(tenantIds) });
    }
    
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: CreateUserDto): Promise<User | null> {
    const { roleIds, tenantIds, ...userData } = updateData;
    
    const user = await this.userRepository.findOne({ 
      where: { id }, 
      relations: ['roles', 'tenants'] 
    });
    
    if (!user) return null;
    
    Object.assign(user, userData);
    
    if (roleIds !== undefined) {
      user.roles = roleIds.length ? await this.roleRepository.findBy({ id: In(roleIds) }) : [];
    }
    
    if (tenantIds !== undefined) {
      user.tenants = tenantIds.length ? await this.tenantRepository.findBy({ id: In(tenantIds) }) : [];
    }
    
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }
  async findOneByUsername(username: string) {
    return await this.userRepository.findOneBy({ username });
  }
}