import type { PasswordResetCodes } from '../services/password-reset-codes';
import {
  buildActiveStudent,
  codeServiceStub,
  userRepositoryStub,
} from '../../testing/auth-fixtures';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

describe('RequestPasswordResetUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let codes: ReturnType<typeof codeServiceStub>;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    codes = codeServiceStub();
    useCase = new RequestPasswordResetUseCase(users, codes as unknown as PasswordResetCodes);
  });

  it('issues a reset code for an existing account', async () => {
    const user = buildActiveStudent();
    users.findByEmail.mockResolvedValue(user);

    await useCase.execute({ email: ' ANA@discente.uefs.br ' });

    expect(users.findByEmail).toHaveBeenCalledWith('ana@discente.uefs.br');
    expect(codes.issueFor).toHaveBeenCalledWith(user);
  });

  it('stays silent for an unknown e-mail', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'x@uefs.br' })).resolves.toBeUndefined();
    expect(codes.issueFor).not.toHaveBeenCalled();
  });
});
