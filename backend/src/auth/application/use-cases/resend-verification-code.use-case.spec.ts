import type { EmailVerificationCodes } from '../services/email-verification-codes';
import {
  buildActiveStudent,
  buildStudent,
  codeServiceStub,
  userRepositoryStub,
} from '../../testing/auth-fixtures';
import { ResendVerificationCodeUseCase } from './resend-verification-code.use-case';

describe('ResendVerificationCodeUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let codes: ReturnType<typeof codeServiceStub>;
  let useCase: ResendVerificationCodeUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    codes = codeServiceStub();
    useCase = new ResendVerificationCodeUseCase(users, codes as unknown as EmailVerificationCodes);
  });

  it('issues a new code for a pending account', async () => {
    const user = buildStudent();
    users.findByEmail.mockResolvedValue(user);

    await useCase.execute({ email: ' ANA@discente.uefs.br ' });

    expect(users.findByEmail).toHaveBeenCalledWith('ana@discente.uefs.br');
    expect(codes.issueFor).toHaveBeenCalledWith(user);
  });

  it.each([
    ['unknown e-mail', null],
    ['active account', buildActiveStudent()],
  ])('stays silent for an %s', async (_label, user) => {
    users.findByEmail.mockResolvedValue(user);

    await expect(useCase.execute({ email: 'x@discente.uefs.br' })).resolves.toBeUndefined();
    expect(codes.issueFor).not.toHaveBeenCalled();
  });
});
