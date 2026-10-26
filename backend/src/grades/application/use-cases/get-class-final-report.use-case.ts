import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
  type RoomStudentSummary,
} from '@/rooms/domain/repositories/room.repository';
import type { Room } from '@/rooms/domain/entities/room.entity';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import { presentGrade } from '../../domain/entities/grade-calculator';
import { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import type {
  ClassFinalReportResponseDto,
  ClassReportProblemDto,
  ClassReportRoomDto,
  ClassReportStudentDto,
  ClassReportStudentProblemGradeDto,
} from '../dtos/class-final-report-response.dto';

export interface GetClassFinalReportInput {
  roomId: string;
  tutorId: string;
}

type GradesByProblemMap = Map<string, Map<string, number | null>>;

@Injectable()
export class GetClassFinalReportUseCase {
  constructor(
    private readonly roomAccess: RoomAccessService,
    @Inject(ROOM_REPOSITORY) private readonly roomRepository: RoomRepository,
    @Inject(PROBLEM_REPOSITORY) private readonly problemRepository: ProblemRepository,
    private readonly getProblemGrades: GetProblemGradesUseCase,
  ) {}

  async execute(input: GetClassFinalReportInput): Promise<ClassFinalReportResponseDto> {
    const room = await this.roomAccess.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const [students, problems] = await Promise.all([
      this.roomRepository.findStudents(input.roomId),
      this.problemRepository.findByRoomId(input.roomId),
    ]);
    const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));
    const gradesByProblem = await this.loadProblemGrades(input.roomId, input.tutorId, problems);

    return this.buildReportResponse(room, problems, sortedStudents, gradesByProblem);
  }

  private async loadProblemGrades(
    roomId: string,
    tutorId: string,
    problems: Problem[],
  ): Promise<GradesByProblemMap> {
    const gradesByProblem: GradesByProblemMap = new Map();
    for (const problem of problems) {
      const report = await this.getProblemGrades.execute({
        roomId,
        problemId: problem.id,
        tutorId,
      });
      const studentGrades = new Map<string, number | null>();
      for (const student of report.alunos) {
        studentGrades.set(student.alunoId, student.notaFinal);
      }
      gradesByProblem.set(problem.id, studentGrades);
    }
    return gradesByProblem;
  }

  private buildRoomReport(room: Room): ClassReportRoomDto {
    return {
      id: room.id,
      nome: room.name,
      codigoDisciplina: room.courseCode,
      semestre: room.semester,
    };
  }

  private buildProblemsReport(problems: Problem[]): ClassReportProblemDto[] {
    return problems.map((problem) => ({
      id: problem.id,
      titulo: problem.title,
      ordem: problem.orderIndex ?? 0,
    }));
  }

  private buildReportResponse(
    room: Room,
    problems: Problem[],
    students: RoomStudentSummary[],
    gradesByProblem: GradesByProblemMap,
  ): ClassFinalReportResponseDto {
    return {
      sala: this.buildRoomReport(room),
      problemas: this.buildProblemsReport(problems),
      alunos: students.map((student) =>
        this.buildStudentReport(student, problems, gradesByProblem),
      ),
    };
  }

  private buildStudentProblemGrades(
    studentId: string,
    problems: Problem[],
    gradesByProblem: GradesByProblemMap,
  ): ClassReportStudentProblemGradeDto[] {
    return problems.map((problem) => ({
      problemaId: problem.id,
      notaFinal: gradesByProblem.get(problem.id)?.get(studentId) ?? null,
    }));
  }

  private buildStudentReport(
    student: RoomStudentSummary,
    problems: Problem[],
    gradesByProblem: GradesByProblemMap,
  ): ClassReportStudentDto {
    const notasProblemas = this.buildStudentProblemGrades(student.id, problems, gradesByProblem);
    const available = notasProblemas.flatMap((item) =>
      item.notaFinal !== null ? [item.notaFinal] : [],
    );
    const { mediaGeral, isParcial } = this.calculateAverageSummary(available, problems.length);

    return {
      id: student.id,
      nome: student.name,
      matricula: student.registrationNumber,
      notasProblemas,
      mediaGeral,
      isParcial,
    };
  }

  private calculateAverageSummary(
    available: number[],
    totalProblems: number,
  ): { mediaGeral: number | null; isParcial: boolean } {
    if (available.length === 0) {
      return { mediaGeral: null, isParcial: true };
    }
    const sum = available.reduce((acc, curr) => acc + curr, 0);
    const mediaGeral = presentGrade(sum / available.length);
    const isParcial = totalProblems === 0 || available.length < totalProblems;
    return { mediaGeral, isParcial };
  }
}
