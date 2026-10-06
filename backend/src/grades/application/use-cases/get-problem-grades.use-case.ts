import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import type { GradeComponent } from '../../domain/entities/grade-calculator';
import {
  GRADES_REPOSITORY,
  type GradesRepository,
} from '../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import {
  processStudentGrades,
  type Row,
  type StudentResponse,
} from './helpers/get-problem-grades.helper';
import { buildGradeResponse, selectComponents } from './helpers/grade-response.helper';

interface ProblemData {
  sessions: Row[];
  students: Row[];
  formulas: Row[];
  scores: Row[];
  attendances: Row[];
  roles: Row[];
  criteria: Row[];
}

interface FormulaContext {
  formula: Row | undefined;
  components: GradeComponent[];
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
}

@Injectable()
export class GetProblemGradesUseCase {
  constructor(
    @Inject(GRADES_REPOSITORY) private readonly gradesRepository: GradesRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: {
    roomId: string;
    problemId: string;
    tutorId: string;
  }): Promise<GradesResponseDto> {
    await this.roomAccess.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const problem = await this.gradesRepository.findProblem(input.problemId, input.roomId);
    if (!problem) throw new NotFoundError('Problema não encontrado na sala informada.');

    const data = await this.gradesRepository.findProblemData(
      input.roomId,
      input.problemId,
      problem.performance_table_id,
    );
    const effective = await this.withDefaults(data.formulas, data.criteria);

    const result = this.calculate({ ...data, ...effective });
    await this.saveGrades(input.problemId, result);
    return result.response;
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
  ): Promise<{ formulas: Row[]; components: Row[] }> {
    const components = await this.loadComponents(formulas);
    const result = [...formulas];
    this.applySessionDefault(result, components, criteria);
    this.applyProblemDefault(result, components);
    return { formulas: result, components };
  }

  private applySessionDefault(formulas: Row[], components: Row[], criteria: Row[]): void {
    if (formulas.some((f) => f.scope === 'SESSAO') || criteria.length === 0) return;
    formulas.push({ id: '__default_session', scope: 'SESSAO', version: null });
    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    components.push(
      ...criteria.map((c) => ({
        formula_id: '__default_session',
        type: 'CRITERIO',
        reference_id: c.id,
        weight: (Number(c.weight) / totalWeight) * 100,
      })),
    );
  }

  private applyProblemDefault(formulas: Row[], components: Row[]): void {
    if (formulas.some((f) => f.scope === 'PROBLEMA')) return;
    formulas.push({ id: '__default_problem', scope: 'PROBLEMA', version: null });
    components.push({
      formula_id: '__default_problem',
      type: 'MEDIA_SESSOES',
      reference_id: null,
      weight: 100,
    });
  }

  private calculate(data: CalculationData): CalculationResult {
    const session = this.buildContext(data, 'SESSAO');
    const problem = this.buildContext(data, 'PROBLEMA');
    const { students, sessionRows, problemRows } = this.processStudents(data, session, problem);

    return {
      response: buildGradeResponse(data.sessions, students, session.formula, problem.formula),
      sessionRows,
      problemRows,
    };
  }

  private buildContext(data: CalculationData, scope: 'SESSAO' | 'PROBLEMA'): FormulaContext {
    const formula = data.formulas.find((f: Row) => f.scope === scope);
    return {
      formula,
      components: selectComponents(data.components, formula),
    };
  }

  private processStudents(
    data: CalculationData,
    session: FormulaContext,
    problem: FormulaContext,
  ): StudentsResult {
    const processed = data.students.map((student) =>
      processStudentGrades(this.studentContext(data, student, session, problem)),
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
    session: FormulaContext,
    problem: FormulaContext,
  ) {
    return {
      student,
      sessions: data.sessions,
      scores: data.scores,
      attendances: data.attendances,
      roles: data.roles,
      sessionComponents: session.components,
      problemComponents: problem.components,
      sessionFormulaVersion: (session.formula?.version as number) ?? 1,
      problemFormulaVersion: (problem.formula?.version as number) ?? 1,
    };
  }
}
