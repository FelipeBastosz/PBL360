import { describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { commitmentTermsService } from './commitmentTerms.service';

vi.mock('./api');

describe('commitmentTermsService', () => {
  it('calls /termos-compromisso/vigente and returns current term data', async () => {
    const mockTerm = {
      versao: '1.2',
      titulo: 'Termos de Uso e Política de Privacidade – PBL360',
      texto: '# Termos de Uso e Política de Privacidade',
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTerm });

    const result = await commitmentTermsService.getCurrentTerm();

    expect(api.get).toHaveBeenCalledWith('/termos-compromisso/vigente');
    expect(result).toEqual(mockTerm);
  });

  it('calls GET /usuarios/meu-aceite-termo and returns acceptance status', async () => {
    const mockStatus = {
      aceito: false,
      versaoAceita: '1.1',
      aceitoEm: '2026-11-01T10:00:00.000Z',
      versaoVigente: '1.2',
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockStatus });

    const result = await commitmentTermsService.getMyAcceptanceStatus();

    expect(api.get).toHaveBeenCalledWith('/usuarios/meu-aceite-termo');
    expect(result).toEqual(mockStatus);
  });

  it('calls POST /usuarios/meu-aceite-termo and returns updated acceptance status', async () => {
    const mockStatus = {
      aceito: true,
      versaoAceita: '1.2',
      aceitoEm: '2026-11-17T12:00:00.000Z',
      versaoVigente: '1.2',
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockStatus });

    const result = await commitmentTermsService.acceptTerm('1.2');

    expect(api.post).toHaveBeenCalledWith('/usuarios/meu-aceite-termo', { versao: '1.2' });
    expect(result).toEqual(mockStatus);
  });
});
