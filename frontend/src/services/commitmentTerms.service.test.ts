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
});
