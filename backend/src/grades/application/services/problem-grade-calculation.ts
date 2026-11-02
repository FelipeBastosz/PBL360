import type {
  GradePersistenceData,
  GradeRow,
  ProblemGradeData,
} from '../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import { buildGradeResponse, selectComponents } from '../use-cases/helpers/grade-response.helper';
import { processStudentGrades } from '../use-cases/helpers/get-problem-grades.helper';
import {
  appendMissingSessionComponents,
  buildDefaultSessionComponents,
} from '../use-cases/helpers/session-formula.helper';

export function calculateProblemGrades(
  data: ProblemGradeData,
  storedComponents: GradeRow[],
  now = new Date(),
): GradePersistenceData & { response: GradesResponseDto } {
  const formulas = [...data.formulas];
  const components = [...storedComponents];
  applyDefaults(data, formulas, components);
  const problem = formulas.find((formula) => formula.scope === 'PROBLEMA');
  const sessions = sessionContexts(data.sessions, formulas, components);
  const processed = processStudents(data, components, problem, sessions, now);
  return calculationResult(data, processed, sessions[0]?.formula, problem);
}

function calculationResult(
  data: ProblemGradeData,
  processed: ReturnType<typeof processStudents>,
  sessionFormula: GradeRow | undefined,
  problemFormula: GradeRow | undefined,
) {
  return {
    response: buildGradeResponse(
      data.sessions,
      processed.map((item) => item.responseStudent),
      sessionFormula,
      problemFormula,
    ),
    sessionRows: processed.flatMap((item) => item.sessionRows),
    problemRows: processed.map((item) => item.problemRow),
  };
}

function processStudents(
  data: ProblemGradeData,
  components: GradeRow[],
  problem: GradeRow | undefined,
  sessions: ReturnType<typeof sessionContexts>,
  now: Date,
) {
  return data.students.map((student) =>
    processStudentGrades({
      ...data,
      student,
      now,
      sessionFormulas: sessions,
      problemComponents: selectComponents(components, problem),
      problemFormulaVersion: (problem?.version as number) ?? 1,
    }),
  );
}

function applyDefaults(data: ProblemGradeData, formulas: GradeRow[], components: GradeRow[]) {
  for (const session of data.sessions) {
    addSessionDefault(String(session.id), data.criteria, formulas, components);
  }
  const problem = formulas.find((formula) => formula.scope === 'PROBLEMA');
  if (problem) {
    if (typeof problem.id === 'string')
      appendMissingSessionComponents(problem.id, components, data.sessions);
    return;
  }
  formulas.push({ id: '__default_problem', scope: 'PROBLEMA', version: null });
  components.push({
    formula_id: '__default_problem',
    type: 'MEDIA_SESSOES',
    reference_id: null,
    weight: 100,
  });
}

function addSessionDefault(
  sessionId: string,
  criteria: GradeRow[],
  formulas: GradeRow[],
  components: GradeRow[],
) {
  if (formulas.some((formula) => formula.scope === 'SESSAO' && formula.session_id === sessionId))
    return;
  if (!criteria.some((criterion) => criterion.session_id === sessionId)) return;
  const id = `__default_session_${sessionId}`;
  formulas.push({ id, scope: 'SESSAO', session_id: sessionId, version: null, is_default: true });
  components.push(...buildDefaultSessionComponents(sessionId, id));
}

function sessionContexts(sessions: GradeRow[], formulas: GradeRow[], components: GradeRow[]) {
  return sessions.map((session) => {
    const sessionId = String(session.id);
    const formula = formulas.find(
      (candidate) => candidate.scope === 'SESSAO' && String(candidate.session_id) === sessionId,
    );
    return {
      sessionId,
      formula,
      components: selectComponents(components, formula),
      formulaVersion: (formula?.version as number) ?? 1,
      defaultFormula: Boolean(formula?.is_default),
    };
  });
}
