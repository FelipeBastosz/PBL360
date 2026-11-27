import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './swagger.config';
import { configureApp } from './app.setup';

jest.mock('helmet', () => jest.fn(() => 'helmet-middleware'));
jest.mock('@/shared/realtime/cors-io.adapter', () => ({
  CorsIoAdapter: class MockCorsIoAdapter {},
}));
jest.mock('./swagger.config', () => ({ setupSwagger: jest.fn() }));

describe('configureApp', () => {
  const createApp = (environment: string, apiPrefix?: string, trustProxy?: boolean) => {
    const values: Record<string, unknown> = {
      'app.apiPrefix': apiPrefix,
      'app.trustProxy': trustProxy,
      'app.corsOrigin': ['https://pbl360.example.test'],
      'app.env': environment,
    };
    const config = {
      get: jest.fn((key: string) => values[key]),
      getOrThrow: jest.fn((key: string) => values[key]),
    };
    let healthMiddleware:
      ((req: { url?: string }, response: unknown, next: () => void) => void) | undefined;
    const app = {
      get: jest.fn().mockReturnValue(config),
      set: jest.fn(),
      use: jest.fn((middleware: unknown) => {
        if (typeof middleware === 'function') {
          healthMiddleware = middleware as typeof healthMiddleware;
        }
      }),
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      useWebSocketAdapter: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
    };
    return { app, config, healthMiddleware: () => healthMiddleware };
  };

  beforeEach(() => jest.clearAllMocks());

  it('configures the API, health rewrite, validation, websocket adapter and Swagger outside production', () => {
    const { app, config, healthMiddleware } = createApp('development', 'v1', true);
    configureApp(app as never);

    expect(app.get).toHaveBeenCalledWith(ConfigService);
    expect(app.set).toHaveBeenCalledWith('trust proxy', true);
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('v1');
    expect(app.enableCors).toHaveBeenCalledWith({ origin: ['https://pbl360.example.test'] });
    expect(app.useWebSocketAdapter).toHaveBeenCalledTimes(1);
    expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);
    expect(app.useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(setupSwagger).toHaveBeenCalledWith(app, 'v1/docs');
    expect(config.getOrThrow).toHaveBeenCalledWith('app.corsOrigin');

    const rewrite = healthMiddleware();
    const next = jest.fn();
    const healthRequest = { url: '/saude' };
    rewrite?.(healthRequest, {}, next);
    expect(healthRequest.url).toBe('/v1/saude');
    expect(next).toHaveBeenCalledTimes(1);
    const otherRequest = { url: '/outro' };
    rewrite?.(otherRequest, {}, next);
    expect(otherRequest.url).toBe('/outro');
  });

  it('uses defaults and omits Swagger in production', () => {
    const { app } = createApp('production');
    configureApp(app as never);

    expect(app.set).toHaveBeenCalledWith('trust proxy', false);
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(setupSwagger).not.toHaveBeenCalled();
  });
});
