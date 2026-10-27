import { Test } from '@nestjs/testing';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { ForbiddenError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { EvaluationAccessService } from './evaluation-access.service';

describe('EvaluationAccessService', () => {
  const sessions = { assertTutorCanAccessSessionById: jest.fn() };
  const evaluations = { isEnrolled: jest.fn() };
  let service: EvaluationAccessService;
  beforeEach(async () => {
    jest.resetAllMocks();
    sessions.assertTutorCanAccessSessionById.mockResolvedValue({
      session: { id: 'session', problemId: 'problem' },
      roomId: 'room',
    });
    evaluations.isEnrolled.mockResolvedValue(true);
    const module = await Test.createTestingModule({
      providers: [
        EvaluationAccessService,
        { provide: SessionAccessService, useValue: sessions },
        { provide: EVALUATION_REPOSITORY, useValue: evaluations },
      ],
    }).compile();
    service = module.get(EvaluationAccessService);
  });
  it('uses room tutor access and checks student enrollment', async () => {
    await expect(service.forStudent('session', 'student', 'co-tutor')).resolves.toEqual({
      sessionId: 'session',
      problemId: 'problem',
      roomId: 'room',
    });
    expect(sessions.assertTutorCanAccessSessionById).toHaveBeenCalledWith('session', 'co-tutor');
    expect(evaluations.isEnrolled).toHaveBeenCalledWith('room', 'student');
  });
  it('rejects an unenrolled student', async () => {
    evaluations.isEnrolled.mockResolvedValue(false);
    await expect(service.forStudent('session', 'student', 'tutor')).rejects.toThrow(
      UnprocessableEntityError,
    );
  });
  it('does not disclose enrollment to an unauthorized tutor', async () => {
    sessions.assertTutorCanAccessSessionById.mockRejectedValue(
      new ForbiddenError('Acesso negado.'),
    );
    await expect(service.forStudent('session', 'student', 'other')).rejects.toThrow(ForbiddenError);
    expect(evaluations.isEnrolled).not.toHaveBeenCalled();
  });
});
