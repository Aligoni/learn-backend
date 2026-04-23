import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthResponseDto } from './../src/auth/dto/auth-response.dto';
import { UserPublicDto } from './../src/users/dto/user-public.dto';
import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.JWT_SECRET = 'e2e-test-secret-must-be-long-enough-for-hs256';
    process.env.DATABASE_PATH = ':memory:';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sign-up then GET /auth/me with bearer token', async () => {
    const email = `user-${Date.now()}@example.com`;
    const signUp = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({
        email,
        password: 'Password123!',
      })
      .expect(201);

    const signedUp = signUp.body as AuthResponseDto;
    expect(signedUp.accessToken).toBeDefined();
    expect(signedUp.user.email).toBe(email.toLowerCase());

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${signedUp.accessToken}`)
      .expect(200);

    const profile = me.body as UserPublicDto;
    expect(profile.id).toBe(signedUp.user.id);
    expect(profile.email).toBe(email.toLowerCase());
  });
});
