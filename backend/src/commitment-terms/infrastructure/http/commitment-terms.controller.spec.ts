import { CommitmentTermsController } from './commitment-terms.controller';

describe('CommitmentTermsController', () => {
  it('returns the current term in the public API shape', async () => {
    const term = { version: '1.2', title: 'Termo PBL360', content: 'Texto vigente' };
    const getCurrentTerm = { execute: jest.fn().mockResolvedValue(term) };
    const controller = new CommitmentTermsController(getCurrentTerm as never);

    await expect(controller.getCurrent()).resolves.toEqual({
      versao: '1.2',
      titulo: 'Termo PBL360',
      texto: 'Texto vigente',
    });
    expect(getCurrentTerm.execute).toHaveBeenCalledTimes(1);
  });
});
