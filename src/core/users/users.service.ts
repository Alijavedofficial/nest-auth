import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserParams } from './user.interface';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
  ) {}

  async find(findBy: FindOptionsWhere<User>): Promise<User> {
    const user: User | null = await this.user.findOne({ where: findBy });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(params: CreateUserParams): Promise<User> {
    const id: string = uuid();

    try {
      const newUser: User = this.user.create({ id, ...params });
      return await this.user.save(newUser);
    } catch (error) {
      this.handleError(error, 'creating');
    }
  }

  async delete(id: string): Promise<void> {
    const user: User = await this.find({ id });
    try {
      await this.user.remove(user);
    } catch (error) {
      this.logger.error(`Error deleting user with id ${id}:`, error);
      this.handleError(error, 'deleting');
    }
  }

  private handleError(error: unknown, action: string): never {
    if (
      error instanceof QueryFailedError &&
      error?.driverError?.constraint === 'UQ_User_email'
    )
      throw new ConflictException('This email is already in use.');

    this.logger.error(error);

    throw new InternalServerErrorException(
      `Something went wrong while ${action} a user.`,
    );
  }
}
