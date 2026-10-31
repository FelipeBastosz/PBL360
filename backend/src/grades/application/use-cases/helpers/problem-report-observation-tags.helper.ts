import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportTableSection,
} from '@/report-files/domain/report-document';
import type { ProblemObservationTagDetail } from '@/grades/domain/repositories/grades.repository';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';

const observationTagsColumns = (ocultarNomes: boolean): ReportColumn[] =>
  ocultarNomes
    ? [
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão', type: ReportColumnType.TEXT },
        { header: 'Marcações', type: ReportColumnType.TEXT },
      ]
    : [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão', type: ReportColumnType.TEXT },
        { header: 'Marcações', type: ReportColumnType.TEXT },
      ];

function toObservationTagRow(
  item: ProblemObservationTagDetail,
  studentMap: Map<string, GradesResponseDto['alunos'][number]>,
  ocultarNomes: boolean,
): ReportCellValue[] | null {
  if (!item.tags || item.tags.length === 0) return null;
  const student = studentMap.get(item.studentId);
  const matricula = student?.matricula ?? null;
  const tagsText = item.tags.join(', ');

  if (ocultarNomes) {
    return [matricula, item.sessionTitle, tagsText];
  }
  return [student?.nome ?? 'Aluno', matricula, item.sessionTitle, tagsText];
}

export function buildObservationTagsTableSection(
  marcacoes: ProblemObservationTagDetail[],
  studentMap: Map<string, GradesResponseDto['alunos'][number]>,
  ocultarNomes = false,
): ReportTableSection | null {
  const rows = marcacoes
    .map((item) => toObservationTagRow(item, studentMap, ocultarNomes))
    .filter((row): row is ReportCellValue[] => row !== null);

  if (rows.length === 0) return null;

  return {
    kind: 'table',
    title: 'Marcações das sessões',
    columns: observationTagsColumns(ocultarNomes),
    rows,
  };
}
