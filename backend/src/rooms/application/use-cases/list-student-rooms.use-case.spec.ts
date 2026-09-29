import { roomRepositoryStub } from '../../testing/room-fixtures';
import { ListStudentRoomsUseCase } from './list-student-rooms.use-case';

describe('ListStudentRoomsUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let useCase: ListStudentRoomsUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    useCase = new ListStudentRoomsUseCase(rooms);
  });

  it('returns rooms associated with the requested student', async () => {
    const expected = [{ roomId: 'room-id', name: 'PBL', semester: '2026.1', totalStudents: 8 }];
    rooms.findForStudent.mockResolvedValue(expected);

    await expect(useCase.execute('student-id')).resolves.toEqual(expected);
    expect(rooms.findForStudent).toHaveBeenCalledWith('student-id');
  });
});
