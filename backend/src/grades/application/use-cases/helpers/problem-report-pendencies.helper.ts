import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportTableSection,
} from '@/report-files/domain/report-document';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';

const pendencyColumns = (ocultarNomes: boolean): ReportColumn[] =>
  ocultarNomes
    ? [
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ]
    : [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ];

function extractStudentPendencies(
  student: GradesResponseDto['alunos'][number],
  sessionMap: Map<string, string>,
  ocultarNomes = false,
): ReportCellValue[][] {
  return student.sessoes
    .filter((session) => session.situacao === 'PENDENTE')
    .map((session) => {
      const sessionTitle = sessionMap.get(session.sessaoId) ?? 'Sessão';
      if (ocultarNomes) {
        return [student.matricula ?? null, sessionTitle];
      }
      return [student.nome, student.matricula ?? null, sessionTitle];
    });
}

export function buildPendenciesTableSection(
  grades: GradesResponseDto,
  ocultarNomes = false,
): ReportTableSection | null {
  const sessionMap = new Map(
    grades.sessoes.map((s) => [s.id, s.title || s.rotulo || s.nome || 'Sessão']),
  );
  const rows = grades.alunos.flatMap((student) =>
    extractStudentPendencies(student, sessionMap, ocultarNomes),
  );
  if (rows.length === 0) return null;

  return {
    kind: 'table',
    title: 'Pendências de avaliação',
    columns: pendencyColumns(ocultarNomes),
    rows,
  };
}
