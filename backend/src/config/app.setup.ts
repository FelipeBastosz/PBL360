import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { DomainExceptionFilter } from '@/shared/filters/domain-exception.filter';
import { validationExceptionFactory } from '@/shared/pipes/validation-exception.factory';
import { setupSwagger } from './swagger.config';

const configureHealthRewrite = (app: NestExpressApplication, apiPrefix: string): void => {
  app.use((req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url === '/saude') {
      req.url = `/${apiPrefix}/saude`;
    }
    next();
  });
};

const configurePipesAndFilters = (app: NestExpressApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
};

export const configureApp = (app: NestExpressApplication): void => {
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api';

  app.set('trust proxy', config.get<boolean | number | string>('app.trustProxy') ?? false);
  app.use(helmet());
  configureHealthRewrite(app, apiPrefix);
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: config.getOrThrow<string[]>('app.corsOrigin') });
  configurePipesAndFilters(app);

  if (config.get<string>('app.env') !== 'production') {
    setupSwagger(app, `${apiPrefix}/docs`);
  }
};
