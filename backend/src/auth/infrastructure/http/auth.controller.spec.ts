import { UserTypePayload } from '../../application/dtos/user-type-payload.enum';
import { buildActiveStudent, buildStudent } from '../../testing/auth-fixtures';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const expiresAt = new Date('2026-10-01T10:00:00.000Z');
  let controller: AuthController;
  let registerUser: { execute: jest.Mock };
  let login: { execute: jest.Mock };
  let verifyEmailCode: { execute: jest.Mock };
  let resendVerificationCode: { execute: jest.Mock };
  let requestPasswordReset: { execute: jest.Mock };
  let validatePasswordResetCode: { execute: jest.Mock };
  let resetPassword: { execute: jest.Mock };

  beforeEach(() => {
    registerUser = { execute: jest.fn().mockResolvedValue(buildStudent()) };
    login = {
      execute: jest.fn().mockResolvedValue({
        user: buildActiveStudent(),
        accessToken: { value: 'jwt', expiresAt },
      }),
    };
    verifyEmailCode = {
      execute: jest.fn().mockResolvedValue({
        user: buildActiveStudent(),
        accessToken: { value: 'verified-jwt', expiresAt },
      }),
    };
    resendVerificationCode = { execute: jest.fn().mockResolvedValue(undefined) };
    requestPasswordReset = { execute: jest.fn().mockResolvedValue(undefined) };
    validatePasswordResetCode = {
      execute: jest.fn().mockResolvedValue({ value: 'reset-token', expiresAt }),
    };
    resetPassword = { execute: jest.fn().mockResolvedValue(undefined) };
    controller = new AuthController(
      registerUser as never,
      login as never,
      verifyEmailCode as never,
      resendVerificationCode as never,
      requestPasswordReset as never,
      validatePasswordResetCode as never,
      resetPassword as never,
    );
  });

  it('registers a user and returns instructions for email verification', async () => {
    const result = await controller.register(
      {
        nome: 'Ana Souza',
        email: 'ana@example.com',
        senha: 'senha-secreta',
        tipo: UserTypePayload.ALUNO,
        versaoTermo: '1.2',
        aceitaTermos: true,
      },
      { buffer: Buffer.from('photo') },
    );

    expect(registerUser.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com', acceptsTerms: true }),
    );
    expect(result.mensagem).toContain('código de verificação');
    expect(result.usuarioId).toBe('user-1');
  });

  it('signs in and returns the session response', async () => {
    await expect(
      controller.signIn({ email: 'ana@example.com', senha: 'secret' }),
    ).resolves.toMatchObject({
      token: 'jwt',
      expiraEm: expiresAt,
      usuario: { nome: 'Ana Souza' },
    });
    expect(login.execute).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secret' });
  });

  it('verifies an email code and returns the activated session', async () => {
    await expect(
      controller.verifyCode({ usuarioId: 'user-1', email: 'ana@example.com', codigo: '123456' }),
    ).resolves.toMatchObject({ mensagem: 'Conta ativada com sucesso.', token: 'verified-jwt' });
    expect(verifyEmailCode.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'ana@example.com',
      code: '123456',
    });
  });

  it('resends verification and requests password recovery with privacy-safe responses', async () => {
    await expect(controller.resendCode({ email: 'ana@example.com' })).resolves.toHaveProperty(
      'mensagem',
      'Se houver uma conta pendente de verificação com este e-mail, enviamos um novo código.',
    );
    await expect(
      controller.requestPasswordResetCode({ email: 'ana@example.com' }),
    ).resolves.toHaveProperty(
      'mensagem',
      'Se houver uma conta com este e-mail, enviamos um código de recuperação de senha.',
    );
    expect(resendVerificationCode.execute).toHaveBeenCalledWith({ email: 'ana@example.com' });
    expect(requestPasswordReset.execute).toHaveBeenCalledWith({ email: 'ana@example.com' });
  });

  it('validates a reset code and returns a reset token', async () => {
    await expect(
      controller.validateResetCode({ email: 'ana@example.com', codigo: '123456' }),
    ).resolves.toEqual({ token: 'reset-token', expiraEm: expiresAt });
    expect(validatePasswordResetCode.execute).toHaveBeenCalledWith({
      email: 'ana@example.com',
      code: '123456',
    });
  });

  it('resets the password and confirms completion', async () => {
    await expect(
      controller.redefinePassword({ token: 'reset-token', novaSenha: 'nova-senha' }),
    ).resolves.toEqual({ mensagem: 'Senha redefinida com sucesso.' });
    expect(resetPassword.execute).toHaveBeenCalledWith({
      resetToken: 'reset-token',
      newPassword: 'nova-senha',
    });
  });
});
