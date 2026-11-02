import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
  type ProblemFeedbackDetail,
} from '@/feedbacks/domain/repositories/feedback.repository';
import {
  REPORT_FILE_GENERATOR,
  type ReportFileGenerator,
} from '@/report-files/domain/services/report-file-generator';
import type { ReportFile, ReportFileFormat } from '@/report-files/domain/report-document';
import { NotFoundError } from '@/shared/errors/application.error';
import { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import { buildProblemReportDocument } from './helpers/problem-report-document.helper';
import {
  GRADES_REPOSITORY,
  type GradesRepository,
  type ProblemObservationTagDetail,
} from '../../domain/repositories/grades.repository';
import type { Room } from '@/rooms/domain/entities/room.entity';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { GradesResponseDto } from '../dtos/grades-response.dto';

export interface ExportProblemReportInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  format: ReportFileFormat;
  ocultarNomes?: boolean;
  mostrarFeedback?: boolean | null;
  mostrarMarcacoes?: boolean | null;
}

type LoadedReportData = [
  GradesResponseDto,
  ProblemFeedbackDetail[] | null,
  ProblemObservationTagDetail[] | null,
];

@Injectable()
export class ExportProblemReportUseCase {
  constructor(
    private readonly roomAccess: RoomAccessService,
    @Inject(PROBLEM_REPOSITORY) private readonly problemRepository: ProblemRepository,
    private readonly getProblemGrades: GetProblemGradesUseCase,
    @Inject(FEEDBACK_REPOSITORY) private readonly feedbackRepository: FeedbackRepository,
    @Inject(REPORT_FILE_GENERATOR) private readonly reportFiles: ReportFileGenerator,
    @Inject(GRADES_REPOSITORY) private readonly gradesRepository: GradesRepository,
  ) {}

  async execute(input: ExportProblemReportInput): Promise<ReportFile> {
    const { room, problem } = await this.validateAccess(input);
    const [grades, feedbacks, marcacoes] = await this.loadReportData(input);
    const document = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      marcacoes,
      format: input.format,
      ocultarNomes: input.ocultarNomes,
      mostrarFeedback: input.mostrarFeedback,
      mostrarMarcacoes: input.mostrarMarcacoes,
    });
    return this.reportFiles.generate(document);
  }

  private async validateAccess(
    input: ExportProblemReportInput,
  ): Promise<{ room: Room; problem: Problem }> {
    const room = await this.roomAccess.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const problem = await this.problemRepository.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }
    return { room, problem };
  }

  private loadReportData(input: ExportProblemReportInput): Promise<LoadedReportData> {
    const loadFeedbacks =
      input.mostrarFeedback !== false && input.mostrarFeedback !== null
        ? this.feedbackRepository.findProblemFeedbacksWithDetails(input.problemId)
        : Promise.resolve(null);
    const loadTags =
      input.mostrarMarcacoes !== false && input.mostrarMarcacoes !== null
        ? this.gradesRepository.findProblemObservationTags(input.problemId)
        : Promise.resolve(null);

    return Promise.all([
      this.getProblemGrades.execute({
        roomId: input.roomId,
        problemId: input.problemId,
        tutorId: input.tutorId,
      }),
      loadFeedbacks,
      loadTags,
    ]);
  }
}
