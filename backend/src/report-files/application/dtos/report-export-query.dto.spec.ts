import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReportFileFormat } from '../../domain/report-document';
import { INVALID_REPORT_FORMAT_MESSAGE } from '../services/report-file.service';
import { ReportExportQueryDto } from './report-export-query.dto';

const toQuery = (query: Record<string, unknown>) => plainToInstance(ReportExportQueryDto, query);

const validateQuery = (query: Record<string, unknown>) =>
  validate(toQuery(query), { whitelist: true, forbidNonWhitelisted: true });

describe('ReportExportQueryDto', () => {
  it.each(['PDF', 'XLSX'])('accepts %s', async (formato) => {
    expect(await validateQuery({ formato })).toEqual([]);
  });

  it('accepts the format in any case', async () => {
    expect(toQuery({ formato: ' pdf ' }).formato).toBe(ReportFileFormat.PDF);
    expect(await validateQuery({ formato: 'xlsx' })).toEqual([]);
  });

  it.each([{ formato: 'DOCX' }, { formato: '' }, {}])(
    'rejects %p with a message in Portuguese',
    async (query) => {
      const [error] = await validateQuery(query);

      expect(error?.property).toBe('formato');
      expect(Object.values(error?.constraints ?? {})).toEqual([INVALID_REPORT_FORMAT_MESSAGE]);
    },
  );
});
