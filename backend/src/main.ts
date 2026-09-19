import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api';

  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: config.get<string>('app.corsOrigin') ?? '*' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());

  setupSwagger(app, `${apiPrefix}/docs`);

  await app.listen(config.get<number>('app.port') ?? 3000);
}

void bootstrap();
