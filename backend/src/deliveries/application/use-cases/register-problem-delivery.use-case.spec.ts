import { Test } from '@nestjs/testing';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { InvalidProblemDeliveryError } from '../../domain/errors/invalid-problem-delivery.error';
import {
  PROBLEM_DELIVERY_REPOSITORY,
  type ProblemDeliveryRepository,
  type ProblemDeliverySummary,
} from '../../domain/repositories/problem-delivery.repository';
import { RegisterProblemDeliveryUseCase } from './register-problem-delivery.use-case';

const ROOM_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ROOM_ID = '99999999-9999-4999-8999-999999999999';
const PROBLEM_ID = '22222222-2222-4222-8222-222222222222';
const STUDENT_ID = '33333333-3333-4333-8333-333333333333';

const SUMMARY: ProblemDeliverySummary = {
  id: '44444444-4444-4444-8444-444444444444',
  url: 'https://github.com/uefs/pbl360',
  submittedBy: { id: STUDENT_ID, name: 'Ana Souza' },
  submittedAt: new Date('2026-11-23T21:30:00.000Z'),
};

describe('RegisterProblemDeliveryUseCase', () => {
  let useCase: RegisterProblemDeliveryUseCase;
  let deliveries: jest.Mocked<ProblemDeliveryRepository>;
  let problems: jest.Mocked<Pick<ProblemRepository, 'findById'>>;
  let roomAccess: jest.Mocked<Pick<RoomAccessService, 'assertMemberCanAccessRoom'>>;

  beforeEach(async () => {
    deliveries = {
      registerForStudent: jest.fn(),
      listActiveByProblem: jest.fn(),
      findActiveByProblemAndStudent: jest.fn(),
    };
    problems = { findById: jest.fn() };
    roomAccess = { assertMemberCanAccessRoom: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegisterProblemDeliveryUseCase,
        { provide: PROBLEM_DELIVERY_REPOSITORY, useValue: deliveries },
        { provide: PROBLEM_REPOSITORY, useValue: problems },
        { provide: RoomAccessService, useValue: roomAccess },
      ],
    }).compile();

    useCase = moduleRef.get(RegisterProblemDeliveryUseCase);
  });

  it('registers a delivery for an enrolled student on a problem in the room', async () => {
    problems.findById.mockResolvedValue({ id: PROBLEM_ID, roomId: ROOM_ID } as Problem);
    deliveries.registerForStudent.mockResolvedValue(SUMMARY);

    const result = await useCase.execute({
      roomId: ROOM_ID,
      problemId: PROBLEM_ID,
      studentId: STUDENT_ID,
      url: ' https://github.com/uefs/pbl360 ',
    });

    expect(roomAccess.assertMemberCanAccessRoom).toHaveBeenCalledWith(ROOM_ID, {
      id: STUDENT_ID,
      type: UserType.STUDENT,
    });
    expect(deliveries.registerForStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: ROOM_ID,
        problemId: PROBLEM_ID,
        submittedBy: STUDENT_ID,
        url: 'https://github.com/uefs/pbl360',
      }),
    );
    expect(result).toEqual(SUMMARY);
  });

  it('propagates ForbiddenError when the student is not enrolled in the room', async () => {
    roomAccess.assertMemberCanAccessRoom.mockRejectedValue(
      new ForbiddenError('Você não participa desta sala.'),
    );

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        problemId: PROBLEM_ID,
        studentId: STUDENT_ID,
        url: 'https://github.com/uefs/pbl360',
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(deliveries.registerForStudent).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the problem does not exist', async () => {
    problems.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        problemId: PROBLEM_ID,
        studentId: STUDENT_ID,
        url: 'https://github.com/uefs/pbl360',
      }),
    ).rejects.toThrow(NotFoundError);
    expect(deliveries.registerForStudent).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the problem belongs to another room', async () => {
    problems.findById.mockResolvedValue({ id: PROBLEM_ID, roomId: OTHER_ROOM_ID } as Problem);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        problemId: PROBLEM_ID,
        studentId: STUDENT_ID,
        url: 'https://github.com/uefs/pbl360',
      }),
    ).rejects.toThrow(NotFoundError);
    expect(deliveries.registerForStudent).not.toHaveBeenCalled();
  });

  it('throws InvalidProblemDeliveryError for non-HTTPS URLs before hitting the repository', async () => {
    problems.findById.mockResolvedValue({ id: PROBLEM_ID, roomId: ROOM_ID } as Problem);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        problemId: PROBLEM_ID,
        studentId: STUDENT_ID,
        url: 'http://github.com/uefs/pbl360',
      }),
    ).rejects.toThrow(InvalidProblemDeliveryError);
    expect(deliveries.registerForStudent).not.toHaveBeenCalled();
  });
});
