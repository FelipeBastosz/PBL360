import 'reflect-metadata';
import type { ParseUUIDPipe } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { UuidParam } from './uuid-param.decorator';

interface RouteArgumentMetadata {
  data?: string;
  pipes: unknown[];
}

const parameterPipe = (version?: '3' | '4' | '5' | '7'): ParseUUIDPipe => {
  class TestController {
    handler(_id: string): void {}
  }
  UuidParam('id', version)(TestController.prototype, 'handler', 0);
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as Record<
    string,
    RouteArgumentMetadata
  >;
  return Object.values(metadata)[0].pipes[0] as ParseUUIDPipe;
};

describe('UuidParam', () => {
  it('accepts a UUID matching the requested version', async () => {
    const pipe = parameterPipe('4');
    const uuid = '123e4567-e89b-42d3-a456-426614174000';

    await expect(pipe.transform(uuid, { type: 'param', data: 'id' })).resolves.toBe(uuid);
  });

  it('uses the parameter name in the invalid UUID response', async () => {
    const pipe = parameterPipe('4');

    await expect(pipe.transform('not-a-uuid', { type: 'param', data: 'id' })).rejects.toThrow(
      'O parâmetro "id" deve ser um UUID válido.',
    );
  });

  it('rejects a valid UUID whose version differs from the requested version', async () => {
    const pipe = parameterPipe('4');
    const uuidV7 = '01890f3e-7c00-7000-8000-000000000000';

    await expect(pipe.transform(uuidV7, { type: 'param', data: 'id' })).rejects.toThrow(
      'O parâmetro "id" deve ser um UUID válido.',
    );
  });
});
