import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['X-Cart-Session'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Learn Backend API')
    .setDescription(
      'Starter HTTP API for frontend practice: authentication with JWT, SQLite persistence, ' +
        'and strict request validation. Extend with more modules as you learn.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Paste the `accessToken` from sign-up or log-in into the Authorize dialog.',
      },
      'access-token',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Cart-Session',
        in: 'header',
        description:
          'Guest cart session id. Returned by the first cart write in the response body ' +
          '(`sessionId`) and the `X-Cart-Session` response header. Ignored when a Bearer token is also present.',
      },
      'cart-session',
    )
    .addTag('cart', 'Shopping cart for guests and authenticated users.')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);

  const base = `http://localhost:${port}`;
  const logger = new Logger('Bootstrap');
  logger.log(`Application listening at ${base}`);
  logger.log(`Swagger UI: ${base}/api`);
}

void bootstrap();
