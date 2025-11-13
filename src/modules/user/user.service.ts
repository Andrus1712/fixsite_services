import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/global/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'globalConnection')
    private readonly userRepository: Repository<User>,
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
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.userRepository.findOne({ where: { id } });
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