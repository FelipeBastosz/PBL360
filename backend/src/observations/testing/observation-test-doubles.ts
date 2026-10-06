import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { Observation, type NewObservation } from '../domain/entities/observation.entity';
import type { ObservationRepository } from '../domain/repositories/observation.repository';

export const fakeObservationRepository = (): jest.Mocked<ObservationRepository> => ({
  findRegistrationContext: jest.fn(),
  create: jest.fn((observation: Observation) => Promise.resolve(observation)),
  findById: jest.fn(),
  updateText: jest.fn(),
  delete: jest.fn(),
  findForStudentInSession: jest.fn(),
});

export const fakeSessionAccess = (roomId = 'room-1'): jest.Mocked<SessionAccessService> =>
  ({
    assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({ session: {}, roomId }),
  }) as unknown as jest.Mocked<SessionAccessService>;

export const anObservation = (overrides: Partial<NewObservation> = {}): Observation =>
  Object.assign(
    Observation.register({
      sessionId: 'session-1',
      studentId: 'student-1',
      authorId: 'tutor-1',
      text: null,
      tags: [{ id: 'tag-1', name: 'Atraso' }],
      ...overrides,
    }),
    { id: 'observation-1' },
  );
