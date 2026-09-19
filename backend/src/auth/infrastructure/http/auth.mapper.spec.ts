import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { UserTypePayload } from '../../application/dtos/user-type-payload.enum';
import type { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { toRegisterUserInput, toSessionResponse, toUserResponse } from './auth.mapper';

describe('auth.mapper', () => {
  const student = (): User =>
    User.create({
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      passwordHash: 'hashed',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      photoUrl: 'https://example.com/ana.png',
    });

  it('translates the Portuguese payload into the domain input', () => {
    const dto: RegisterUserDto = {
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
      tipo: UserTypePayload.ALUNO,
      matricula: '20240001',
      fotoUrl: 'https://example.com/ana.png',
    };

    expect(toRegisterUserInput(dto)).toEqual({
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      password: 'senha-secreta',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      photoUrl: 'https://example.com/ana.png',
    });
  });

  it('maps a tutor payload onto the domain tutor type', () => {
    const dto = {
      nome: 'Carlos Mendes',
      email: 'carlos@uefs.br',
      senha: 'senha-secreta',
      tipo: UserTypePayload.PROFESSOR,
    } as RegisterUserDto;

    expect(toRegisterUserInput(dto)).toMatchObject({
      type: UserType.TUTOR,
      registrationNumber: null,
      photoUrl: null,
    });
  });

  it('never exposes the password hash', () => {
    expect(toUserResponse(student())).not.toHaveProperty('passwordHash');
  });

  it('answers with the Portuguese field names', () => {
    const expiresAt = new Date('2026-09-20T12:00:00.000Z');
    const response = toSessionResponse({
      user: student(),
      accessToken: { value: 'jwt-token', expiresAt },
    });

    expect(response).toEqual({
      token: 'jwt-token',
      expiraEm: expiresAt,
      usuario: {
        id: undefined,
        nome: 'Ana Souza',
        email: 'ana@discente.uefs.br',
        tipo: UserTypePayload.ALUNO,
        matricula: '20240001',
        fotoUrl: 'https://example.com/ana.png',
        ativo: true,
        criadoEm: undefined,
      },
    });
  });
});
