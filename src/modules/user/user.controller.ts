import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../entities/global/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';

@Controller('users')
@UseGuards(TenantSelectionGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('all')
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.userService.getAllUsers(pageNum, limitNum, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: CreateUserDto,
  ): Promise<User | null> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}