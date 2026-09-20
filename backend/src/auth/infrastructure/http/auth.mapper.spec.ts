import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { UserTypePayload } from '../../application/dtos/user-type-payload.enum';
import type { RegisterUserDto } from '../../application/dtos/register-user.dto';
import type { VerifyEmailCodeDto } from '../../application/dtos/verify-email-code.dto';
import {
  toRegisterResponse,
  toRegisterUserInput,
  toSessionResponse,
  toUserResponse,
  toVerifyEmailCodeInput,
} from './auth.mapper';

describe('auth.mapper', () => {
  const student = (): User => {
    const user = User.create({
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      passwordHash: 'hashed',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      photoUrl: 'https://example.com/ana.png',
    });
    user.activate();

    return user;
  };

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

  it('translates the verification payload into the domain input', () => {
    const dto: VerifyEmailCodeDto = {
      usuarioId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'ana@discente.uefs.br',
      codigo: '123456',
    };

    expect(toVerifyEmailCodeInput(dto)).toEqual({
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'ana@discente.uefs.br',
      code: '123456',
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

  it('answers the registration with the id needed by the verification route', () => {
    const pending = User.create({
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      passwordHash: 'hashed',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      photoUrl: 'https://example.com/ana.png',
    });
    pending.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const response = toRegisterResponse(pending, 'Cadastro realizado.');

    expect(response).toMatchObject({
      mensagem: 'Cadastro realizado.',
      usuarioId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      usuario: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', ativo: false },
    });
    expect(response).not.toHaveProperty('token');
  });
});
