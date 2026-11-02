import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReportFileFormat } from '@/report-files/domain/report-document';
import { ExportSessionReportQueryDto } from './export-session-report-query.dto';

const toQuery = (query: Record<string, unknown>) =>
  plainToInstance(ExportSessionReportQueryDto, query);

const validateQuery = (query: Record<string, unknown>) =>
  validate(toQuery(query), { whitelist: true, forbidNonWhitelisted: true });

describe('ExportSessionReportQueryDto', () => {
  it('accepts the format without optional export settings', async () => {
    const query = toQuery({ formato: 'PDF' });

    expect(query.formato).toBe(ReportFileFormat.PDF);
    expect(query.ocultarNome).toBeUndefined();
    expect(query.mostrarFeedBack).toBeUndefined();
    expect(query.mostrarMarcacoes).toBeUndefined();
    expect(await validateQuery({ formato: 'PDF' })).toEqual([]);
  });

  it.each([
    ['true', true],
    [true, true],
    ['1', true],
    ['false', false],
    [false, false],
    ['0', false],
  ])('transforms %p to boolean %p', async (input, expected) => {
    const query = toQuery({
      formato: 'PDF',
      ocultarNome: input,
      mostrarFeedBack: input,
      mostrarMarcacoes: input,
    });

    expect(query.ocultarNome).toBe(expected);
    expect(query.mostrarFeedBack).toBe(expected);
    expect(query.mostrarMarcacoes).toBe(expected);
    expect(
      await validateQuery({
        formato: 'PDF',
        ocultarNome: input,
        mostrarFeedBack: input,
        mostrarMarcacoes: input,
      }),
    ).toEqual([]);
  });

  it.each([
    ['ocultarNome', { formato: 'PDF', ocultarNome: 'invalido' }],
    ['mostrarFeedBack', { formato: 'PDF', mostrarFeedBack: 'invalido' }],
    ['mostrarMarcacoes', { formato: 'PDF', mostrarMarcacoes: 'invalido' }],
  ])('rejects invalid %s values', async (field, query) => {
    const [error] = await validateQuery(query);

    expect(error?.property).toBe(field);
    expect(Object.values(error?.constraints ?? {})).toEqual([
      `O campo ${field} deve ser um booleano.`,
    ]);
  });
});
