import { RoomFeedbacksController } from './room-feedbacks.controller';
import type { SaveStudentProblemFeedbackUseCase } from '../../application/use-cases/save-student-problem-feedback.use-case';
import type { SaveGeneralProblemFeedbackUseCase } from '../../application/use-cases/save-general-problem-feedback.use-case';
import type { GetProblemFeedbacksUseCase } from '../../application/use-cases/get-problem-feedbacks.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';

describe('RoomFeedbacksController', () => {
  let controller: RoomFeedbacksController;
  let saveStudentUseCase: jest.Mocked<SaveStudentProblemFeedbackUseCase>;
  let saveGeneralUseCase: jest.Mocked<SaveGeneralProblemFeedbackUseCase>;
  let getProblemFeedbacksUseCase: jest.Mocked<GetProblemFeedbacksUseCase>;

  beforeEach(() => {
    saveStudentUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SaveStudentProblemFeedbackUseCase>;

    saveGeneralUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SaveGeneralProblemFeedbackUseCase>;

    getProblemFeedbacksUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProblemFeedbacksUseCase>;

    controller = new RoomFeedbacksController(
      saveStudentUseCase,
      saveGeneralUseCase,
      getProblemFeedbacksUseCase,
    );
  });

  it('handles saveStudent endpoint', async () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 9.0,
      text: 'Muito bom.',
    });
    feedback.id = 'fb-id';
    saveStudentUseCase.execute.mockResolvedValue(feedback);

    const result = await controller.saveStudent(
      'room-1',
      'problem-1',
      'student-1',
      { nota: 9.0, texto: 'Muito bom.' },
      'tutor-1',
    );

    expect(result.id).toBe('fb-id');
    expect(result.nota).toBe(9.0);
    expect(result.texto).toBe('Muito bom.');
    expect(saveStudentUseCase.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      problemId: 'problem-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
      score: 9.0,
      text: 'Muito bom.',
    });
  });

  it('handles saveGeneral endpoint', async () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      scope: FeedbackScope.PROBLEM,
      text: 'Feedback coletivo.',
    });
    feedback.id = 'fb-general';
    saveGeneralUseCase.execute.mockResolvedValue(feedback);

    const result = await controller.saveGeneral(
      'room-1',
      'problem-1',
      { texto: 'Feedback coletivo.' },
      'tutor-1',
    );

    expect(result.id).toBe('fb-general');
    expect(result.texto).toBe('Feedback coletivo.');
    expect(saveGeneralUseCase.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'tutor-1',
      text: 'Feedback coletivo.',
    });
  });

  it('handles getFeedbacks endpoint', async () => {
    getProblemFeedbacksUseCase.execute.mockResolvedValue({
      general: null,
      students: [],
    });

    const result = await controller.getFeedbacks('room-1', 'problem-1', 'tutor-1');

    expect(result.geral).toBeNull();
    expect(result.alunos).toEqual([]);
    expect(getProblemFeedbacksUseCase.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'tutor-1',
    });
  });
});
