import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const database =
          config.get<string>('DATABASE_PATH') ?? './data/dev.sqlite';
        if (!database.startsWith(':memory:')) {
          const dir = dirname(database);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
        }
        const nodeEnv = config.get<string>('NODE_ENV');
        const synchronize = nodeEnv !== 'production';
        return {
          type: 'sqlite',
          database,
          entities: [User],
          synchronize,
          logging: nodeEnv === 'development',
        };
      },
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
