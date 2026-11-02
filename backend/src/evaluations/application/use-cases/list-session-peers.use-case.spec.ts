import { Test } from '@nestjs/testing';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import { ATTENDANCE_REPOSITORY } from '@/sessions/domain/repositories/attendance.repository';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { ListSessionPeersUseCase } from './list-session-peers.use-case';

describe('ListSessionPeersUseCase', () => {
  let useCase: ListSessionPeersUseCase;
  const sessionAccess = {
    assertMemberCanAccessSession: jest.fn(),
  };
  const evaluationRepository = {
    listSessionPeers: jest.fn(),
  };
  const attendanceRepository = {
    findBySession: jest.fn(),
    findEnrolledStudents: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ListSessionPeersUseCase,
        { provide: SessionAccessService, useValue: sessionAccess },
        { provide: EVALUATION_REPOSITORY, useValue: evaluationRepository },
        { provide: ATTENDANCE_REPOSITORY, useValue: attendanceRepository },
      ],
    }).compile();

    useCase = module.get(ListSessionPeersUseCase);
  });

  it('returns present peers with initials and status when session is released', async () => {
    const deadline = new Date('2026-10-15T23:59:59Z');
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: {
        id: 'sess-1',
        peerEvalReleased: true,
        peerEvalDeadline: deadline,
      },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });

    attendanceRepository.findBySession.mockResolvedValue([
      { studentId: 'student-1', status: AttendanceStatus.PRESENT },
      { studentId: 'student-2', status: AttendanceStatus.PRESENT },
      { studentId: 'student-3', status: AttendanceStatus.LATE },
      { studentId: 'student-4', status: AttendanceStatus.PRESENT },
    ]);

    attendanceRepository.findEnrolledStudents.mockResolvedValue([
      { id: 'student-1', name: 'Avaliador' },
      { id: 'student-2', name: 'Ana Beatriz Souza' },
      { id: 'student-3', name: 'Carlos Eduardo' },
      { id: 'student-4', name: 'Daniel' },
    ]);

    evaluationRepository.listSessionPeers.mockResolvedValue([
      { alunoId: 'student-2', nome: 'Ana Beatriz Souza', status: null },
      { alunoId: 'student-3', nome: 'Carlos Eduardo', status: EvaluationStatus.DRAFT },
      { alunoId: 'student-4', nome: 'Daniel', status: EvaluationStatus.SUBMITTED },
    ]);

    const result = await useCase.execute('sess-1', 'student-1');

    expect(sessionAccess.assertMemberCanAccessSession).toHaveBeenCalledWith('sess-1', {
      id: 'student-1',
      type: UserType.STUDENT,
    });
    expect(result).toEqual({
      liberada: true,
      prazo: deadline,
      chamadaRealizada: true,
      colegas: [
        { alunoId: 'student-2', nome: 'Ana Beatriz Souza', iniciais: 'AS', status: 'PENDENTE' },
        { alunoId: 'student-3', nome: 'Carlos Eduardo', iniciais: 'CE', status: 'RASCUNHO' },
        { alunoId: 'student-4', nome: 'Daniel', iniciais: 'D', status: 'ENVIADA' },
      ],
    });
  });

  it('omits absent and excused students when crossing enrolled students with roll call records', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: {
        id: 'sess-1',
        peerEvalReleased: true,
        peerEvalDeadline: null,
      },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });

    // Enrolled: student-1 (evaluator), student-2 (present), student-3 (absent), student-4 (excused), student-5 (not recorded)
    attendanceRepository.findEnrolledStudents.mockResolvedValue([
      { id: 'student-1', name: 'Avaliador Aluno' },
      { id: 'student-2', name: 'Presente Aluno' },
      { id: 'student-3', name: 'Ausente Aluno' },
      { id: 'student-4', name: 'Justificado Aluno' },
      { id: 'student-5', name: 'Nao Chamado Aluno' },
    ]);

    attendanceRepository.findBySession.mockResolvedValue([
      { studentId: 'student-1', status: AttendanceStatus.PRESENT },
      { studentId: 'student-2', status: AttendanceStatus.PRESENT },
      { studentId: 'student-3', status: AttendanceStatus.ABSENT },
      { studentId: 'student-4', status: AttendanceStatus.EXCUSED },
    ]);

    evaluationRepository.listSessionPeers.mockResolvedValue([]);

    const result = await useCase.execute('sess-1', 'student-1');

    expect(result.chamadaRealizada).toBe(true);
    expect(result.colegas).toHaveLength(1);
    expect(result.colegas[0]).toEqual({
      alunoId: 'student-2',
      nome: 'Presente Aluno',
      iniciais: 'PA',
      status: 'PENDENTE',
    });

    // Ensure absent, excused, unrecorded, and self are strictly omitted
    const colleagueIds = result.colegas.map((c) => c.alunoId);
    expect(colleagueIds).not.toContain('student-1');
    expect(colleagueIds).not.toContain('student-3');
    expect(colleagueIds).not.toContain('student-4');
    expect(colleagueIds).not.toContain('student-5');
  });

  it('signals chamadaRealizada: false and returns empty colleagues list if roll call has not been recorded', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: {
        id: 'sess-1',
        peerEvalReleased: true,
        peerEvalDeadline: null,
      },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });

    attendanceRepository.findBySession.mockResolvedValue([]);

    const result = await useCase.execute('sess-1', 'student-1');

    expect(result).toEqual({
      liberada: true,
      prazo: null,
      chamadaRealizada: false,
      colegas: [],
    });
    expect(attendanceRepository.findEnrolledStudents).not.toHaveBeenCalled();
    expect(evaluationRepository.listSessionPeers).not.toHaveBeenCalled();
  });

  it('returns empty list if evaluating student was absent in roll call', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: {
        id: 'sess-1',
        peerEvalReleased: true,
        peerEvalDeadline: null,
      },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });

    attendanceRepository.findBySession.mockResolvedValue([
      { studentId: 'student-1', status: AttendanceStatus.ABSENT },
      { studentId: 'student-2', status: AttendanceStatus.PRESENT },
    ]);

    const result = await useCase.execute('sess-1', 'student-1');

    expect(result).toEqual({
      liberada: true,
      prazo: null,
      chamadaRealizada: true,
      colegas: [],
    });
    expect(attendanceRepository.findEnrolledStudents).not.toHaveBeenCalled();
  });

  it('fails if student does not belong to the room', async () => {
    sessionAccess.assertMemberCanAccessSession.mockRejectedValue(
      new ForbiddenError('Aluno sem vínculo com a sala.'),
    );

    await expect(useCase.execute('sess-1', 'student-outsider')).rejects.toThrow(ForbiddenError);
    expect(attendanceRepository.findBySession).not.toHaveBeenCalled();
    expect(evaluationRepository.listSessionPeers).not.toHaveBeenCalled();
  });

  it('fails if session is not found', async () => {
    sessionAccess.assertMemberCanAccessSession.mockRejectedValue(
      new NotFoundError('Sessão não encontrada.'),
    );

    await expect(useCase.execute('sess-unknown', 'student-1')).rejects.toThrow(NotFoundError);
  });
});
