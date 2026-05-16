import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';

const BCRYPT_ROUNDS = 12;

const DEFAULTS = {
  name: 'Admin',
  email: 'admin@example.com',
  password: 'admin12345',
};

async function seedAdmin(): Promise<void> {
  const logger = new Logger('SeedAdmin');

  const name = process.env.ADMIN_NAME?.trim() || DEFAULTS.name;
  const email = (
    process.env.ADMIN_EMAIL?.trim() || DEFAULTS.email
  ).toLowerCase();
  const password = process.env.ADMIN_PASSWORD || DEFAULTS.password;

  if (password.length < 8) {
    throw new Error(
      'ADMIN_PASSWORD must be at least 8 characters long (matches SignUpDto validation).',
    );
  }

  const usingDefaults = !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const dataSource = app.get(DataSource);
    const usersRepo = dataSource.getRepository(User);

    const existing = await usersRepo.findOne({ where: { email } });
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    if (existing) {
      existing.name = name;
      existing.passwordHash = passwordHash;
      existing.role = 'admin';
      await usersRepo.save(existing);
      logger.log(`Updated existing admin "${email}" (id=${existing.id}).`);
    } else {
      const created = usersRepo.create({
        name,
        email,
        passwordHash,
        role: 'admin',
      });
      const saved = await usersRepo.save(created);
      logger.log(`Created admin "${email}" (id=${saved.id}).`);
    }

    if (usingDefaults) {
      logger.warn(
        'Using DEFAULT admin credentials. Set ADMIN_EMAIL / ADMIN_PASSWORD in .env to override.',
      );
      logger.warn(`  email:    ${email}`);
      logger.warn(`  password: ${password}`);
    } else {
      logger.log(`Admin credentials sourced from environment variables.`);
    }
  } finally {
    await app.close();
  }
}

void seedAdmin().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
