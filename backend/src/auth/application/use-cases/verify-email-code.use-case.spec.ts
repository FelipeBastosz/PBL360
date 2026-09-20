import { BadRequestException } from '@nestjs/common';
import { VerifyEmailCodeUseCase } from './verify-email-code.use-case';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { EmailVerificationCodeRepository } from '../../domain/repositories/email-verification-code.repository';

describe('VerifyEmailCodeUseCase', () => {
  let useCase: VerifyEmailCodeUseCase;
  let repository: jest.Mocked<EmailVerificationCodeRepository>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findPendingByEmail: jest.fn(),
      markAsUsed: jest.fn(),
    };
    useCase = new VerifyEmailCodeUseCase(repository);
  });

  it('should validate the code successfully and mark it as used', async () => {
    const codeEntity = Object.assign(new EmailVerificationCode(), {
      id: 'uuid-123',
      email: 'usuario@uefs.br',
      code: '123456',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      usedAt: null,
    });

    repository.findPendingByEmail.mockResolvedValue(codeEntity);

    await expect(
      useCase.execute({ email: 'usuario@uefs.br', code: '123456' }),
    ).resolves.toBeUndefined();

    expect(repository.markAsUsed.mock.calls[0][0]).toBe('uuid-123');
  });

  it('should throw BadRequestException if code is not found', async () => {
    repository.findPendingByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'inexistente@uefs.br', code: '123456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw BadRequestException if code is invalid', async () => {
    const codeEntity = Object.assign(new EmailVerificationCode(), {
      id: 'uuid-123',
      email: 'usuario@uefs.br',
      code: '654321',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      usedAt: null,
    });

    repository.findPendingByEmail.mockResolvedValue(codeEntity);

    await expect(
      useCase.execute({ email: 'usuario@uefs.br', code: '123456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw BadRequestException if code is expired', async () => {
    const codeEntity = Object.assign(new EmailVerificationCode(), {
      id: 'uuid-123',
      email: 'usuario@uefs.br',
      code: '123456',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(Date.now() - 11 * 60 * 1000),
      usedAt: null,
    });

    repository.findPendingByEmail.mockResolvedValue(codeEntity);

    await expect(
      useCase.execute({ email: 'usuario@uefs.br', code: '123456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
