import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { AuditFetcherRegistry } from '../admin/audit-fetcher.registry';
import { AdminUsersController } from './admin-users.controller';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AdminModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(
    private readonly fetchers: AuditFetcherRegistry,
    private readonly usersService: UsersService,
  ) {}

  onModuleInit(): void {
    this.fetchers.register('user', async (id) => {
      const user = await this.usersService.findById(id);
      if (!user) return null;
      const dto = this.usersService.toPublicDto(user);
      return dto as unknown as Record<string, unknown>;
    });
  }
}
