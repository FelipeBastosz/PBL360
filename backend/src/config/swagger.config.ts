import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const JWT_SECURITY_SCHEME = 'jwt';

export const setupSwagger = (app: INestApplication, path: string): void => {
  const document = new DocumentBuilder()
    .setTitle('PBL360 API')
    .setDescription(
      'API do PBL360. Os endpoints protegidos exigem o token JWT devolvido por ' +
        '`POST /autenticacao/login` no cabeçalho `Authorization: Bearer <token>`.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, JWT_SECURITY_SCHEME)
    .build();

  SwaggerModule.setup(path, app, () => SwaggerModule.createDocument(app, document), {
    jsonDocumentUrl: `${path}/json`,
    swaggerOptions: { persistAuthorization: true },
  });
};
