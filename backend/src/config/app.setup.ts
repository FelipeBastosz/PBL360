import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { DomainExceptionFilter } from '@/shared/filters/domain-exception.filter';
import { setupSwagger } from './swagger.config';

export const configureApp = (app: NestExpressApplication): void => {
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api';

  app.set('trust proxy', config.get<boolean | number | string>('app.trustProxy') ?? false);
  app.use(helmet());
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: config.getOrThrow<string[]>('app.corsOrigin') });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());

  if (config.get<string>('app.env') !== 'production') {
    setupSwagger(app, `${apiPrefix}/docs`);
  }
};
