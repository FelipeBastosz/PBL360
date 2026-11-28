import { Test } from '@nestjs/testing';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  PROBLEM_DELIVERY_REPOSITORY,
  type ProblemDeliveryRepository,
  type ProblemDeliverySummary,
} from '../../domain/repositories/problem-delivery.repository';
import { ListProblemDeliveriesUseCase } from './list-problem-deliveries.use-case';

const ROOM_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ROOM_ID = '99999999-9999-4999-8999-999999999999';
const PROBLEM_ID = '22222222-2222-4222-8222-222222222222';
const TUTOR_ID = '33333333-3333-4333-8333-333333333333';
const STUDENT_ID = '44444444-4444-4444-8444-444444444444';

const DELIVERY_A: ProblemDeliverySummary = {
  id: '55555555-5555-4555-8555-555555555555',
  url: 'https://drive.google.com/drive/folders/abc',
  submittedBy: { id: STUDENT_ID, name: 'Ana Souza' },
  submittedAt: new Date('2026-11-23T21:30:00.000Z'),
};

describe('ListProblemDeliveriesUseCase', () => {
  let useCase: ListProblemDeliveriesUseCase;
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
        ListProblemDeliveriesUseCase,
        { provide: PROBLEM_DELIVERY_REPOSITORY, useValue: deliveries },
        { provide: PROBLEM_REPOSITORY, useValue: problems },
        { provide: RoomAccessService, useValue: roomAccess },
      ],
    }).compile();

    useCase = moduleRef.get(ListProblemDeliveriesUseCase);
  });

  it('returns all active deliveries and null myDeliveryId for an authorized tutor', async () => {
    problems.findById.mockResolvedValue({ id: PROBLEM_ID, roomId: ROOM_ID } as Problem);
    deliveries.listActiveByProblem.mockResolvedValue([DELIVERY_A]);

    const result = await useCase.execute({
      roomId: ROOM_ID,
      problemId: PROBLEM_ID,
      member: { id: TUTOR_ID, type: UserType.TUTOR },
    });

    expect(result).toEqual({ myDeliveryId: null, deliveries: [DELIVERY_A] });
    expect(deliveries.listActiveByProblem).toHaveBeenCalledWith(PROBLEM_ID);
    expect(deliveries.findActiveByProblemAndStudent).not.toHaveBeenCalled();
  });

  it('returns only the active delivery of the enrolled student with myDeliveryId', async () => {
    problems.findById.mockResolvedValue({ id: PROBLEM_ID, roomId: ROOM_ID } as Problem);
    deliveries.findActiveByProblemAndStudent.mockResolvedValue(DELIVERY_A);

    const result = await useCase.execute({
      roomId: ROOM_ID,
      problemId: PROBLEM_ID,
      member: { id: STUDENT_ID, type: UserType.STUDENT },
    });

    expect(result).toEqual({ myDeliveryId: DELIVERY_A.id, deliveries: [DELIVERY_A] });
    expect(deliveries.findActiveByProblemAndStudent).toHaveBeenCalledWith(PROBLEM_ID, STUDENT_ID);
    expect(deliveries.listActiveByProblem).not.toHaveBeenCalled();
  });

  it('returns empty list and null myDeliveryId when the enrolled student has no delivery', async () => {
    problems.findById.mockResolvedValue({ id: PROBLEM_ID, roomId: ROOM_ID } as Problem);
    deliveries.findActiveByProblemAndStudent.mockResolvedValue(null);

    const result = await useCase.execute({
      roomId: ROOM_ID,
      problemId: PROBLEM_ID,
      member: { id: STUDENT_ID, type: UserType.STUDENT },
    });

    expect(result).toEqual({ myDeliveryId: null, deliveries: [] });
  });

  it('throws ForbiddenError when the member has no access to the room', async () => {
    roomAccess.assertMemberCanAccessRoom.mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        problemId: PROBLEM_ID,
        member: { id: TUTOR_ID, type: UserType.TUTOR },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when the problem does not belong to the room', async () => {
    problems.findById.mockResolvedValue({ id: PROBLEM_ID, roomId: OTHER_ROOM_ID } as Problem);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        problemId: PROBLEM_ID,
        member: { id: TUTOR_ID, type: UserType.TUTOR },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
