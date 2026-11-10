import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReportFileFormat } from '@/report-files/domain/report-document';
import { ExportClassReportQueryDto } from './export-class-report-query.dto';

const toQuery = (query: Record<string, unknown>) =>
  plainToInstance(ExportClassReportQueryDto, query);

const validateQuery = (query: Record<string, unknown>) =>
  validate(toQuery(query), { whitelist: true, forbidNonWhitelisted: true });

describe('ExportClassReportQueryDto', () => {
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
    ['null', false],
    [null, false],
  ])('transforms %p to boolean %p for ocultarNomes', async (input, expected) => {
    const instance = toQuery({ formato: 'PDF', ocultarNomes: input });
    expect(instance.ocultarNomes).toBe(expected);
    expect(await validateQuery({ formato: 'PDF', ocultarNomes: input })).toEqual([]);
  });

  it('rejects invalid non-boolean value for ocultarNomes', async () => {
    const errors = await validateQuery({ formato: 'PDF', ocultarNomes: 'invalido' });
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('ocultarNomes');
  });
});
