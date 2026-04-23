import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserPublicDto } from './dto/user-public.dto';
import { User } from './entities/user.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  toPublicDto(user: User): UserPublicDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return this.usersRepo.findOne({ where: { email: normalized } });
  }

  async create(email: string, plainPassword: string): Promise<User> {
    const normalized = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    const entity = this.usersRepo.create({
      email: normalized,
      passwordHash,
    });
    return this.usersRepo.save(entity);
  }

  async validatePassword(user: User, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.passwordHash);
  }
}
