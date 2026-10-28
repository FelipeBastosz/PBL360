import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import type { GradeComponent } from '../../domain/entities/grade-calculator';
import {
  GRADES_REPOSITORY,
  type GradesRepository,
  type ProblemGradeData,
} from '../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import {
  appendMissingSessionComponents,
  buildDefaultSessionComponents,
} from './helpers/session-formula.helper';
import {
  processStudentGrades,
  type ProblemGradesInput,
  type ProblemGradesWithSessionGrades,
  type Row,
  type StudentResponse,
} from './helpers/get-problem-grades.helper';
import { buildGradeResponse, selectComponents } from './helpers/grade-response.helper';

type ProblemData = ProblemGradeData;

interface FormulaContext {
  formula: Row | undefined;
  components: GradeComponent[];
}

interface SessionFormulaContext extends FormulaContext {
  sessionId: string;
  formulaVersion: number;
  defaultFormula: boolean;
}

interface StudentsResult {
  students: StudentResponse[];
  sessionRows: Row[];
  problemRows: Row[];
}

interface CalculationResult {
  response: GradesResponseDto;
  sessionRows: Row[];
  problemRows: Row[];
}

interface CalculationData extends ProblemData {
  components: Row[];
  now: Date;
}

@Injectable()
export class GetProblemGradesUseCase {
  constructor(
    @Inject(GRADES_REPOSITORY) private readonly gradesRepository: GradesRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: ProblemGradesInput, now = new Date()): Promise<GradesResponseDto> {
    return (await this.calculateAndSave(input, now)).response;
  }

  async executeWithSessionGrades(
    input: ProblemGradesInput,
    now = new Date(),
  ): Promise<ProblemGradesWithSessionGrades> {
    const result = await this.calculateAndSave(input, now);
    return { response: result.response, sessionGrades: result.sessionRows };
  }

  private async calculateAndSave(input: ProblemGradesInput, now: Date): Promise<CalculationResult> {
    await this.roomAccess.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const problem = await this.gradesRepository.findProblem(input.problemId, input.roomId);
    if (!problem) throw new NotFoundError('Problema não encontrado na sala informada.');

    const data = await this.gradesRepository.findProblemData(input.roomId, input.problemId);
    const effective = await this.withDefaults(data.formulas, data.criteria, data.sessions);

    const result = this.calculate({ ...data, ...effective, now });
    await this.saveGrades(input.problemId, result);
    return result;
  }

  private saveGrades(problemId: string, result: CalculationResult): Promise<void> {
    return this.gradesRepository.saveGrades(problemId, {
      sessionRows: result.sessionRows,
      problemRows: result.problemRows,
    });
  }

  private async loadComponents(formulas: Row[]): Promise<Row[]> {
    const ids = formulas.map((f) => f.id).filter(Boolean);
    return this.gradesRepository.findFormulaComponents(ids);
  }

  private async withDefaults(
    formulas: Row[],
    criteria: Row[],
    sessions: Row[],
  ): Promise<{ formulas: Row[]; components: Row[] }> {
    const components = await this.loadComponents(formulas);
    const result = [...formulas];
    this.applySessionDefaults(result, components, criteria, sessions);
    this.applyProblemDefault(result, components, sessions);
    return { formulas: result, components };
  }

  private applySessionDefaults(
    formulas: Row[],
    components: Row[],
    criteria: Row[],
    sessions: Row[],
  ): void {
    for (const session of sessions) {
      this.addDefaultSessionFormula(formulas, components, criteria, String(session.id));
    }
  }

  private addDefaultSessionFormula(
    formulas: Row[],
    components: Row[],
    criteria: Row[],
    sessionId: string,
  ): void {
    if (formulas.some((formula) => formula.scope === 'SESSAO' && formula.session_id === sessionId))
      return;
    if (!criteria.some((criterion) => criterion.session_id === sessionId)) return;
    const formulaId = `__default_session_${sessionId}`;
    formulas.push({
      id: formulaId,
      scope: 'SESSAO',
      session_id: sessionId,
      version: null,
      is_default: true,
    });
    components.push(...buildDefaultSessionComponents(sessionId, formulaId));
  }

  private applyProblemDefault(formulas: Row[], components: Row[], sessions: Row[]): void {
    const existing = formulas.find((f) => f.scope === 'PROBLEMA');
    if (existing) {
      if (typeof existing.id === 'string') {
        appendMissingSessionComponents(existing.id, components, sessions);
      }
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

  private calculate(data: CalculationData): CalculationResult {
    const problem = this.buildContext(data, 'PROBLEMA');
    const sessions = this.buildSessionContexts(data);
    const { students, sessionRows, problemRows } = this.processStudents(data, sessions, problem);

    return {
      response: buildGradeResponse(data.sessions, students, sessions[0]?.formula, problem.formula),
      sessionRows,
      problemRows,
    };
  }

  private buildContext(data: CalculationData, scope: 'PROBLEMA'): FormulaContext {
    const formula = data.formulas.find((f: Row) => f.scope === scope);
    return {
      formula,
      components: selectComponents(data.components, formula),
    };
  }

  private buildSessionContexts(data: CalculationData): SessionFormulaContext[] {
    return data.sessions.map((session) => {
      const sessionId = String(session.id);
      const formula = data.formulas.find(
        (candidate) => candidate.scope === 'SESSAO' && String(candidate.session_id) === sessionId,
      );
      const context: SessionFormulaContext = {
        sessionId,
        formula,
        components: selectComponents(data.components, formula),
        formulaVersion: (formula?.version as number) ?? 1,
        defaultFormula: Boolean(formula?.is_default),
      };
      return context;
    });
  }

  private processStudents(
    data: CalculationData,
    sessions: SessionFormulaContext[],
    problem: FormulaContext,
  ): StudentsResult {
    const processed = data.students.map((student) =>
      processStudentGrades(this.studentContext(data, student, sessions, problem)),
    );

    return {
      students: processed.map((p) => p.responseStudent),
      sessionRows: processed.flatMap((p) => p.sessionRows),
      problemRows: processed.map((p) => p.problemRow),
    };
  }

  private studentContext(
    data: CalculationData,
    student: Row,
    sessions: SessionFormulaContext[],
    problem: FormulaContext,
  ) {
    return {
      ...data,
      student,
      sessionFormulas: sessions,
      problemComponents: problem.components,
      problemFormulaVersion: (problem.formula?.version as number) ?? 1,
    };
  }
}
