import type { ConfigService } from '@nestjs/config';
import { buildTypeOrmOptions } from './typeorm.config';

describe('buildTypeOrmOptions', () => {
  it('reads database connection settings and applies safe local defaults', () => {
    const values: Record<string, unknown> = {
      'database.host': 'localhost',
      'database.port': 5432,
      'database.username': 'pbl',
      'database.password': 'secret',
      'database.database': 'pbl360',
    };
    const config = {
      getOrThrow: jest.fn((key: string) => values[key]),
      get: jest.fn(),
    } as unknown as ConfigService;
    const options = buildTypeOrmOptions(config);
    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'pbl',
      password: 'secret',
      database: 'pbl360',
      synchronize: false,
      logging: false,
      migrationsRun: false,
      autoLoadEntities: true,
    });
    expect(config.getOrThrow).toHaveBeenCalledTimes(5);
    expect(options.entities).toEqual([expect.stringContaining('*.entity.{ts,js}')]);
    expect(options.migrations).toEqual([expect.stringContaining('migrations')]);
  });

  it('uses configured schema synchronization and logging values', () => {
    const config = {
      getOrThrow: jest.fn(
        (key: string) =>
          ({
            'database.host': 'db',
            'database.port': 5432,
            'database.username': 'u',
            'database.password': 'p',
            'database.database': 'd',
          })[key],
      ),
      get: jest.fn(() => true),
    } as unknown as ConfigService;
    expect(buildTypeOrmOptions(config)).toMatchObject({ synchronize: true, logging: true });
  });
});
