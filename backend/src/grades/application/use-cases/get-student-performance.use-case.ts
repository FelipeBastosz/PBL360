import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { DOMAIN_TO_ATTENDANCE_STATUS } from '@/sessions/application/dtos/roll-call.dto';
import { ROOM_REPOSITORY, type RoomRepository } from '@/rooms/domain/repositories/room.repository';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  GRADES_REPOSITORY,
  type GradesRepository,
} from '../../domain/repositories/grades.repository';
import type {
  StudentPerformanceResponseDto,
  StudentPerformanceSessionDto,
} from '../dtos/student-performance-response.dto';
import { GetProblemGradesUseCase } from './get-problem-grades.use-case';

interface StudentPerformanceInput {
  roomId: string;
  studentId: string;
  tutorId: string;
  problemId?: string;
}

type SessionDetail = Awaited<ReturnType<GradesRepository['findStudentSessionDetails']>>[number];

interface OrderedSession extends StudentPerformanceSessionDto {
  sortDate: string;
  problemOrderIndex: number;
  sessionOrderIndex: number;
}

@Injectable()
export class GetStudentPerformanceUseCase {
  constructor(
    private readonly roomAccess: RoomAccessService,
    @Inject(ROOM_REPOSITORY) private readonly rooms: RoomRepository,
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(GRADES_REPOSITORY) private readonly gradesRepository: GradesRepository,
    private readonly getProblemGrades: GetProblemGradesUseCase,
  ) {}

  async execute(input: StudentPerformanceInput): Promise<StudentPerformanceResponseDto> {
    const room = await this.roomAccess.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const student = await this.findRoomStudent(room.id, input.studentId);
    const problems = await this.findProblems(room.id, input.problemId);
    const performanceSessions = await this.calculateSessions(input, problems);
    const details = await this.gradesRepository.findStudentSessionDetails(
      room.id,
      student.id,
      problems.map((problem) => problem.id),
    );
    return {
      sala: { id: room.id, nome: room.name },
      aluno: { id: student.id, nome: student.name },
      sessoes: orderPerformanceSessions(performanceSessions, details),
    };
  }

  private async findRoomStudent(roomId: string, studentId: string) {
    const student = (await this.rooms.findStudents(roomId)).find((item) => item.id === studentId);
    if (!student) throw new NotFoundError('Aluno não encontrado na sala informada.');
    return student;
  }

  private async findProblems(roomId: string, problemId?: string) {
    const problems = await this.problems.findByRoomId(roomId);
    if (!problemId) return problems;
    const problem = problems.find((item) => item.id === problemId);
    if (!problem) throw new NotFoundError('Problema não encontrado na sala informada.');
    return [problem];
  }

  private async calculateSessions(
    input: StudentPerformanceInput,
    problems: Awaited<ReturnType<ProblemRepository['findByRoomId']>>,
  ) {
    const sessions: StudentPerformanceSessionDto[] = [];
    for (const problem of problems) {
      const result = await this.getProblemGrades.execute({
        roomId: input.roomId,
        problemId: problem.id,
        tutorId: input.tutorId,
      });
      sessions.push(...mapStudentSessions(result, input.studentId, problem.id, problem.title));
    }
    return sessions;
  }
}

function mapStudentSessions(
  result: Awaited<ReturnType<GetProblemGradesUseCase['execute']>>,
  studentId: string,
  problemId: string,
  problemTitle: string,
): StudentPerformanceSessionDto[] {
  const student = result.alunos.find((item) => item.alunoId === studentId);
  if (!student) throw new Error(`Missing calculated student ${studentId}.`);
  const sessionLabels = new Map(result.sessoes.map((session) => [session.id, session]));
  return student.sessoes.map((session) =>
    mapStudentSession(session, sessionLabels, problemId, problemTitle),
  );
}

function mapStudentSession(
  session: Awaited<
    ReturnType<GetProblemGradesUseCase['execute']>
  >['alunos'][number]['sessoes'][number],
  labels: Map<string, Awaited<ReturnType<GetProblemGradesUseCase['execute']>>['sessoes'][number]>,
  problemId: string,
  problemTitle: string,
): StudentPerformanceSessionDto {
  const label = labels.get(session.sessaoId);
  if (!label) throw new Error(`Missing session label for session ${session.sessaoId}.`);
  return {
    ...toStudentPerformanceSession(session, label, problemId, problemTitle),
    presenca: null,
    marcacoes: [],
  };
}

function toStudentPerformanceSession(
  session: Awaited<
    ReturnType<GetProblemGradesUseCase['execute']>
  >['alunos'][number]['sessoes'][number],
  label: Awaited<ReturnType<GetProblemGradesUseCase['execute']>>['sessoes'][number],
  problemId: string,
  problemTitle: string,
): Omit<StudentPerformanceSessionDto, 'presenca' | 'marcacoes'> {
  return {
    sessaoId: session.sessaoId,
    problemaId: problemId,
    problemaTitulo: problemTitle,
    rotulo: label.rotulo,
    data: label.data,
    nota: session.nota,
    situacao: session.situacao,
    modalidade: session.modalidade,
  };
}

function orderPerformanceSessions(
  sessions: StudentPerformanceSessionDto[],
  details: SessionDetail[],
): StudentPerformanceSessionDto[] {
  const detailById = new Map(details.map((detail) => [detail.sessionId, detail]));
  return sessions
    .map((session) => enrichSession(session, detailById.get(session.sessaoId)))
    .sort(compareOrderedSessions)
    .map(withoutSortFields);
}

function enrichSession(
  session: StudentPerformanceSessionDto,
  detail?: SessionDetail,
): OrderedSession {
  if (!detail) throw new Error(`Missing session details for session ${session.sessaoId}.`);
  return {
    ...session,
    presenca: detail.attendance ? DOMAIN_TO_ATTENDANCE_STATUS[detail.attendance] : null,
    marcacoes: detail.marks.map((mark) => ({
      id: mark.id,
      nome: mark.name,
      quantidade: Number(mark.quantity),
    })),
    sortDate: detail.date,
    problemOrderIndex: detail.problemOrderIndex,
    sessionOrderIndex: detail.sessionOrderIndex,
  };
}

function compareOrderedSessions(left: OrderedSession, right: OrderedSession): number {
  return (
    left.sortDate.localeCompare(right.sortDate) ||
    left.problemOrderIndex - right.problemOrderIndex ||
    left.sessionOrderIndex - right.sessionOrderIndex ||
    left.sessaoId.localeCompare(right.sessaoId)
  );
}

function withoutSortFields(session: OrderedSession): StudentPerformanceSessionDto {
  const {
    sortDate: _date,
    problemOrderIndex: _problem,
    sessionOrderIndex: _order,
    ...result
  } = session;
  return result;
}
