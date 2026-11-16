import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { UserTermAcceptanceRepository } from '@/commitment-terms/domain/repositories/user-term-acceptance.repository';
import { TERMS_NOT_ACCEPTED_MESSAGE, TermsAcceptanceGuard } from './terms-acceptance.guard';

describe('TermsAcceptanceGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let repository: jest.Mocked<UserTermAcceptanceRepository>;
  let guard: TermsAcceptanceGuard;

  const createMockContext = (user?: { sub?: string }): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    repository = {
      findByUserId: jest.fn(),
      hasAccepted: jest.fn(),
      create: jest.fn(),
    };

    guard = new TermsAcceptanceGuard(reflector, repository);
  });

  it('allows access to public routes', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const context = createMockContext({ sub: 'user-1' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(repository.hasAccepted).not.toHaveBeenCalled();
  });

  it('allows access to routes decorated with @AllowUnacceptedTerms()', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(true);
    const context = createMockContext({ sub: 'user-1' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(repository.hasAccepted).not.toHaveBeenCalled();
  });

  it('allows access if user has accepted the terms', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    repository.hasAccepted.mockResolvedValue(true);
    const context = createMockContext({ sub: 'user-1' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(repository.hasAccepted).toHaveBeenCalledWith('user-1');
  });

  it('throws ForbiddenException if user has not accepted terms', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    repository.hasAccepted.mockResolvedValue(false);
    const context = createMockContext({ sub: 'user-1' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException(TERMS_NOT_ACCEPTED_MESSAGE),
    );
  });

  it('allows access if request has no user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
