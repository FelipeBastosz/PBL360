import { User } from '../../domain/entities/user.entity';
import { UserType } from '../../domain/enums/user-type.enum';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';
import { toUserProfileResponse } from './user.mapper';

describe('user.mapper', () => {
  it('maps tutor user to UserProfileResponseDto', () => {
    const user = new User();
    user.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    user.name = 'Carlos Mendes';
    user.email = 'carlos@uefs.br';
    user.type = UserType.TUTOR;
    user.registrationNumber = null;
    user.hasPhoto = false;

    const dto = toUserProfileResponse(user);

    expect(dto).toEqual({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      nome: 'Carlos Mendes',
      email: 'carlos@uefs.br',
      tipo: UserTypePayload.PROFESSOR,
      matricula: null,
      possuiFoto: false,
    });
  });

  it('maps student user to UserProfileResponseDto', () => {
    const user = new User();
    user.id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    user.name = 'Ana Souza';
    user.email = 'ana@discente.uefs.br';
    user.type = UserType.STUDENT;
    user.registrationNumber = '20240001';
    user.hasPhoto = true;

    const dto = toUserProfileResponse(user);

    expect(dto).toEqual({
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      tipo: UserTypePayload.ALUNO,
      matricula: '20240001',
      possuiFoto: true,
    });
  });
});
