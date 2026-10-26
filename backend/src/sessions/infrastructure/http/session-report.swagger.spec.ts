import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ExportSessionReportUseCase } from '../../application/use-cases/export-session-report.use-case';
import { SessionReportController } from './session-report.controller';

describe('SessionReport Swagger Docs', () => {
  it('documents GET /sessoes/:sessaoId/relatorio/exportacao with all responses, security, and formats', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SessionReportController],
      providers: [
        {
          provide: ExportSessionReportUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    const config = new DocumentBuilder()
      .setTitle('PBL360 API')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, JWT_SECURITY_SCHEME)
      .build();
    const document = SwaggerModule.createDocument(app, config);

    const path = document.paths['/sessoes/{sessaoId}/relatorio/exportacao'];
    expect(path).toBeDefined();
    expect(path?.get).toBeDefined();

    const op = path!.get!;
    expect(op.tags).toContain('Sessões');
    expect(op.summary).toBe('Exporta o relatório da sessão em PDF ou Excel');
    expect(op.security).toEqual(expect.arrayContaining([{ [JWT_SECURITY_SCHEME]: [] }]));

    const responses = Object.keys(op.responses);
    expect(responses).toEqual(expect.arrayContaining(['200', '400', '401', '403', '404', '500']));

    const okResponse = op.responses['200'] as { content: Record<string, unknown> };
    expect(Object.keys(okResponse.content)).toEqual(
      expect.arrayContaining([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]),
    );

    const parameters = op.parameters as Array<{ name?: string; in?: string }> | undefined;
    const formatParam = parameters?.find((p) => p.name === 'formato');
    expect(formatParam).toBeDefined();
    expect(formatParam?.in).toBe('query');
  });
});
