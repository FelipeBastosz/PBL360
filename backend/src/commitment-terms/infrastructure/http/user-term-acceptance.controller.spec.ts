import { UserTermAcceptancesController } from './user-term-acceptance.controller';

describe('UserTermAcceptancesController', () => {
  it('returns the authenticated user acceptance status', async () => {
    const status = {
      aceito: false,
      versaoAceita: null,
      aceitoEm: null,
      versaoVigente: '1.2',
    };
    const getAcceptance = { execute: jest.fn().mockResolvedValue(status) };
    const acceptTerm = { execute: jest.fn() };
    const controller = new UserTermAcceptancesController(
      getAcceptance as never,
      acceptTerm as never,
    );

    await expect(controller.getMyAcceptance('user-1')).resolves.toBe(status);
    expect(getAcceptance.execute).toHaveBeenCalledWith('user-1');
  });

  it('registers acceptance for the authenticated identity and requested version', async () => {
    const status = {
      aceito: true,
      versaoAceita: '1.2',
      aceitoEm: new Date('2026-10-01T00:00:00.000Z'),
      versaoVigente: '1.2',
    };
    const getAcceptance = { execute: jest.fn() };
    const acceptTerm = { execute: jest.fn().mockResolvedValue(status) };
    const controller = new UserTermAcceptancesController(
      getAcceptance as never,
      acceptTerm as never,
    );

    await expect(controller.accept('authenticated-user', { versao: '1.2' })).resolves.toBe(status);
    expect(acceptTerm.execute).toHaveBeenCalledWith({
      userId: 'authenticated-user',
      version: '1.2',
    });
    expect(acceptTerm.execute).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'different-user' }),
    );
  });
});
