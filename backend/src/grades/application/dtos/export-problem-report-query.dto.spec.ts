import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReportFileFormat } from '@/report-files/domain/report-document';
import { ExportProblemReportQueryDto } from './export-problem-report-query.dto';

const toQuery = (query: Record<string, unknown>) =>
  plainToInstance(ExportProblemReportQueryDto, query);

const validateQuery = (query: Record<string, unknown>) =>
  validate(toQuery(query), { whitelist: true, forbidNonWhitelisted: true });

describe('ExportProblemReportQueryDto', () => {
  it('accepts valid query without optional flags', async () => {
    const instance = toQuery({ formato: 'PDF' });
    expect(instance.formato).toBe(ReportFileFormat.PDF);
    expect(instance.ocultarNomes).toBeUndefined();
    expect(instance.mostrarPendencias).toBeUndefined();
    expect(instance.mostrarFeedback).toBeUndefined();
    expect(instance.mostrarMarcacoes).toBeUndefined();
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
  ])('transforms %p to boolean %p for boolean query flags', async (input, expected) => {
    const instance = toQuery({
      formato: 'PDF',
      ocultarNomes: input,
      ocultarNome: input,
      mostrarPendencias: input,
      mostrarFeedback: input,
      mostrarMarcacoes: input,
    });
    expect(instance.ocultarNomes).toBe(expected);
    expect(instance.ocultarNome).toBe(expected);
    expect(instance.mostrarPendencias).toBe(expected);
    expect(instance.mostrarFeedback).toBe(expected);
    expect(instance.mostrarMarcacoes).toBe(expected);
    expect(
      await validateQuery({
        formato: 'PDF',
        ocultarNomes: input,
        ocultarNome: input,
        mostrarPendencias: input,
        mostrarFeedback: input,
        mostrarMarcacoes: input,
      }),
    ).toEqual([]);
  });

  it('rejects invalid non-boolean value for flags', async () => {
    const errors = await validateQuery({
      formato: 'PDF',
      ocultarNomes: 'invalido',
      ocultarNome: 'invalido',
      mostrarPendencias: 'invalido',
      mostrarFeedback: 'invalido',
      mostrarMarcacoes: 'invalido',
    });
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('ocultarNomes');
    expect(properties).toContain('ocultarNome');
    expect(properties).toContain('mostrarPendencias');
    expect(properties).toContain('mostrarFeedback');
    expect(properties).toContain('mostrarMarcacoes');
  });
});
