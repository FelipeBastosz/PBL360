import { UserType } from '../enums/user-type.enum';
import { User } from './user.entity';
import { Tutor } from './tutor.entity';
import { Student } from './student.entity';

describe('User Entities (Domain)', () => {
  const baseProps = {
    nome: 'Fulano da Silva',
    email: 'fulano@uefs.br',
    senhaHash: 'hash_segura_123',
    matricula: '12345678',
    fotoUrl: 'https://exemplo.com/foto.png',
  };

  it('should instantiate a base User with default values', () => {
    const user = new User({
      ...baseProps,
      tipo: UserType.TUTOR,
    });

    expect(user.id).toBeUndefined();
    expect(user.nome).toBe(baseProps.nome);
    expect(user.email).toBe(baseProps.email);
    expect(user.senhaHash).toBe(baseProps.senhaHash);
    expect(user.matricula).toBe(baseProps.matricula);
    expect(user.fotoUrl).toBe(baseProps.fotoUrl);
    expect(user.tipo).toBe(UserType.TUTOR);
    expect(user.ativo).toBe(true);
    expect(user.criadoEm).toBeInstanceOf(Date);
    expect(user.isTutor()).toBe(true);
    expect(user.isAluno()).toBe(false);
  });

  it('should toggle active status with ativar and desativar', () => {
    const user = new User({
      ...baseProps,
      tipo: UserType.ALUNO,
    });

    user.desativar();
    expect(user.ativo).toBe(false);

    user.ativar();
    expect(user.ativo).toBe(true);
  });

  it('should instantiate a Tutor entity with TUTOR type automatically', () => {
    const tutor = new Tutor(baseProps);

    expect(tutor.tipo).toBe(UserType.TUTOR);
    expect(tutor.isTutor()).toBe(true);
    expect(tutor.isAluno()).toBe(false);
  });

  it('should instantiate a Student entity with ALUNO type automatically', () => {
    const student = new Student(baseProps);

    expect(student.tipo).toBe(UserType.ALUNO);
    expect(student.isAluno()).toBe(true);
    expect(student.isTutor()).toBe(false);
  });
});
