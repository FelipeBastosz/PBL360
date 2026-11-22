import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commitmentTermsService } from '@/services/commitmentTerms.service';
import { TermsAndPrivacyContent } from './TermsAndPrivacyContent';

vi.mock('@/services/commitmentTerms.service');

describe('TermsAndPrivacyContent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders fallback content and fetches current term from backend', async () => {
    const mockTerm = {
      versao: '1.2',
      titulo: 'Termos de Uso e Política de Privacidade – PBL360',
      texto: `# Termos de Uso e Política de Privacidade – PBL360

**Versão 1.2 (MVP Acadêmico e Conformidade LGPD – Lei nº 13.709/2018)** • *Atualizado em 17 de novembro de 2026*

O **PBL360** é uma aplicação web experimental da UEFS.

---

### 1. Objeto e Condições de Acesso

O sistema destina-se ao registro pedagógico.

> ### 3. Limitação de Responsabilidade (Leia com Atenção)
> O PBL360 é fornecido no estado em que se encontra.

### 7. Propriedade Intelectual e Canal de Atendimento

Para dúvidas contate contato.pbl360@gmail.com.`,
    };
    vi.mocked(commitmentTermsService.getCurrentTerm).mockResolvedValueOnce(mockTerm);

    render(<TermsAndPrivacyContent />);

    const versionElement = await screen.findByText(
      /Versão 1.2 \(MVP Acadêmico e Conformidade LGPD/i,
    );
    expect(versionElement).toBeInTheDocument();
    expect(screen.getByText('1. Objeto e Condições de Acesso')).toBeInTheDocument();
    expect(
      screen.getByText('3. Limitação de Responsabilidade (Leia com Atenção)'),
    ).toBeInTheDocument();
    expect(screen.getByText(/contato\.pbl360@gmail\.com/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /contato\.pbl360@gmail\.com/i }),
    ).not.toBeInTheDocument();
  });

  it('does not render static fallback in live mode when getCurrentTerm fails and allows retry', async () => {
    const user = userEvent.setup();
    vi.mocked(commitmentTermsService.getCurrentTerm)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        versao: '1.3',
        titulo: 'Termos v1.3',
        texto: '### 1. Novo Documento\n\nConteúdo oficial da versão 1.3.',
      });

    render(<TermsAndPrivacyContent requireLiveTerm />);

    expect(
      await screen.findByText(
        /não foi possível carregar os termos de uso e política de privacidade/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/aplicação web experimental/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText(/conteúdo oficial da versão 1\.3/i)).toBeInTheDocument();
  });
});
