import { SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { setupSwagger } from './swagger.config';

describe('setupSwagger', () => {
  afterEach(() => jest.restoreAllMocks());

  it('registers the Swagger UI and its JSON document endpoint', () => {
    const document = { openapi: '3.0.0' };
    const createDocument = jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockReturnValue(document as never);
    const setup = jest.spyOn(SwaggerModule, 'setup').mockImplementation();
    const app = {} as INestApplication;

    setupSwagger(app, 'api/docs');

    expect(setup).toHaveBeenCalledWith(
      'api/docs',
      app,
      expect.any(Function),
      expect.objectContaining({
        jsonDocumentUrl: 'api/docs/json',
        swaggerOptions: { persistAuthorization: true },
      }),
    );
    const createDocumentFactory = setup.mock.calls[0][2];
    expect(createDocumentFactory?.()).toBe(document);
    expect(createDocument).toHaveBeenCalledWith(
      app,
      expect.objectContaining({ info: expect.any(Object) as Record<string, unknown> }),
    );
  });
});
