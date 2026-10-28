import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReportFileFormat } from '@/report-files/domain/report-document';
import { ExportProblemReportQueryDto } from './export-problem-report-query.dto';

const toQuery = (query: Record<string, unknown>) =>
  plainToInstance(ExportProblemReportQueryDto, query);

const validateQuery = (query: Record<string, unknown>) =>
  validate(toQuery(query), { whitelist: true, forbidNonWhitelisted: true });

describe('ExportProblemReportQueryDto', () => {
  it('accepts valid query without ocultarNomes', async () => {
    const instance = toQuery({ formato: 'PDF' });
    expect(instance.formato).toBe(ReportFileFormat.PDF);
    expect(instance.ocultarNomes).toBeUndefined();
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
    const instance = toQuery({ formato: 'PDF', ocultarNomes: input });
    expect(instance.ocultarNomes).toBe(expected);
    expect(await validateQuery({ formato: 'PDF', ocultarNomes: input })).toEqual([]);
  });

  it('rejects invalid non-boolean value for ocultarNomes', async () => {
    const [error] = await validateQuery({ formato: 'PDF', ocultarNomes: 'invalido' });
    expect(error?.property).toBe('ocultarNomes');
    expect(Object.values(error?.constraints ?? {})).toEqual([
      'O campo ocultarNomes deve ser um booleano.',
    ]);
  });
});
